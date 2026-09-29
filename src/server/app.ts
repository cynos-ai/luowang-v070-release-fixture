import { existsSync } from 'node:fs';

import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import type { Logger } from 'pino';

import type { AuthStatusResponse, HealthResponse } from '../shared/types.js';
import type { AppConfig } from './config.js';
import type { DatabaseContext } from './db/client.js';
import { AppError, toErrorResponse } from './errors.js';
import { createLogger } from './logger.js';
import {
  AuthError,
  createAuthService,
  RegistrationError,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  type AuthService,
} from './security/auth.js';
import { RateLimiter } from './security/rate-limit.js';
import { registerTestDataCleanup } from './test-data-cleanup.js';

export interface AppOptions {
  config: AppConfig;
  database: DatabaseContext;
  logger?: Logger;
  auth?: AuthService;
}

interface JsonRecord {
  [key: string]: unknown;
}

export async function createApp(options: AppOptions) {
  const auth = options.auth ?? createAuthService(options.database.sqlite);
  const app = Fastify({
    loggerInstance: options.logger ?? createLogger(),
    requestIdHeader: 'x-request-id',
  });
  const limiter = new RateLimiter();

  await app.register(fastifyCookie);
  if (existsSync(options.config.webRoot)) {
    await app.register(fastifyStatic, {
      root: options.config.webRoot,
      prefix: '/',
      index: 'index.html',
    });
  }

  app.addHook('preHandler', async (request) => {
    if (
      isWriteMethod(request.method) &&
      request.url.startsWith('/api/') &&
      !isAllowedOrigin(request, options.config.allowedOrigin)
    ) {
      throw new AppError('ORIGIN_FORBIDDEN', '请求来源未被允许', 403);
    }
  });

  if (options.config.testDataCleanupToken) {
    registerTestDataCleanup(app, options.database, options.config.testDataCleanupToken);
  }

  app.get('/health', async (request, reply) => {
    const health = makeHealth(options.config, options.database);
    reply.header('x-request-id', request.id);
    return reply.status(health.status === 'ok' ? 200 : 503).send(health);
  });

  app.get('/api/auth/status', async (request, reply) => {
    const user = auth.authenticate(request.cookies[SESSION_COOKIE_NAME]);
    const response: AuthStatusResponse = { authenticated: user !== null, user };
    reply.header('x-request-id', request.id);
    return reply.send(response);
  });

  app.post('/api/auth/register', async (request, reply) => {
    const body = readBody(request);
    const rateKey = request.ip || 'unknown';
    if (!limiter.allow(`register:${rateKey}`)) {
      reply.header('retry-after', '900');
      throw new AppError('RATE_LIMITED', '请求尝试过于频繁，请稍后再试', 429);
    }
    const result = await auth.register(
      body.email as string,
      body.displayName as string,
      body.password as string,
    );
    limiter.reset(`register:${rateKey}`);
    setSessionCookie(request, reply, result.token);
    return reply.status(201).send({ authenticated: true, user: result.user });
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = readBody(request);
    const rateKey = request.ip || 'unknown';
    if (!limiter.allow(`login:${rateKey}`)) {
      reply.header('retry-after', '900');
      throw new AppError('RATE_LIMITED', '登录尝试过于频繁，请稍后再试', 429);
    }
    const result = await auth.login(body.email as string, body.password as string);
    if (!result) {
      throw new AppError('INVALID_CREDENTIALS', '邮箱或密码不正确', 401);
    }
    limiter.reset(`login:${rateKey}`);
    setSessionCookie(request, reply, result.token);
    return reply.send({ authenticated: true, user: result.user });
  });

  app.post('/api/auth/logout', async (request, reply) => {
    auth.logout(request.cookies[SESSION_COOKIE_NAME]);
    clearSessionCookie(request, reply);
    return reply.send({ authenticated: false, user: null });
  });

  app.get('/api/me', async (request, reply) => {
    const user = auth.authenticate(request.cookies[SESSION_COOKIE_NAME]);
    if (!user) {
      throw new AppError('UNAUTHORIZED', '请先登录', 401);
    }
    return reply.send({ user });
  });

  app.delete('/api/me', async (request, reply) => {
    if (!auth.deleteAccount(request.cookies[SESSION_COOKIE_NAME])) {
      throw new AppError('UNAUTHORIZED', '请先登录', 401);
    }
    clearSessionCookie(request, reply);
    return reply.send({ deleted: true, authenticated: false, user: null });
  });

  app.setNotFoundHandler(async (request, reply) => {
    if (
      request.method === 'GET' &&
      !request.url.startsWith('/api/') &&
      existsSync(options.config.webRoot)
    ) {
      return reply.sendFile('index.html');
    }
    reply.header('x-request-id', request.id);
    return reply.status(404).send(toErrorResponse('NOT_FOUND', 'Resource not found', request.id));
  });

  app.setErrorHandler((error, request, reply) => {
    const possible = error as { statusCode?: unknown; name?: unknown; message?: unknown };
    const statusCode =
      error instanceof AppError
        ? error.statusCode
        : error instanceof RegistrationError
          ? 409
          : error instanceof AuthError
            ? 400
            : typeof possible.statusCode === 'number'
              ? possible.statusCode
              : 500;
    const code =
      error instanceof AppError
        ? error.code
        : error instanceof RegistrationError
          ? error.code
          : error instanceof AuthError
            ? error.code
            : statusCode === 400
              ? 'BAD_REQUEST'
              : 'INTERNAL_ERROR';
    const message =
      error instanceof AppError || error instanceof RegistrationError || error instanceof AuthError
        ? error.message
        : statusCode < 500 && typeof possible.message === 'string'
          ? possible.message
          : 'Internal server error';
    request.log.error({ requestId: request.id, errorCode: code, statusCode }, 'request failed');
    reply.header('x-request-id', request.id);
    return reply.status(statusCode).send(toErrorResponse(code, message, request.id));
  });

  app.addHook('onClose', async () => {
    options.database.close();
  });

  return app;
}

function makeHealth(config: AppConfig, database: DatabaseContext): HealthResponse {
  const healthy = database.isHealthy();
  return {
    status: healthy ? 'ok' : 'degraded',
    service: 'cynos-website',
    version: config.version,
    database: healthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
  };
}

function setSessionCookie(request: FastifyRequest, reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, cookieOptions(request));
}

function clearSessionCookie(request: FastifyRequest, reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { ...cookieOptions(request), maxAge: 0 });
}

function cookieOptions(request: FastifyRequest): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: request.protocol === 'https' || request.headers['x-forwarded-proto'] === 'https',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}

function isAllowedOrigin(request: FastifyRequest, configuredOrigin: string | undefined): boolean {
  const origin = request.headers.origin;
  if (!origin) {
    return true;
  }
  if (configuredOrigin) {
    return origin === configuredOrigin;
  }
  const protocol = request.protocol === 'https' ? 'https' : 'http';
  return origin === `${protocol}://${request.headers.host}`;
}

function isWriteMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function readBody(request: FastifyRequest): JsonRecord {
  if (typeof request.body !== 'object' || request.body === null || Array.isArray(request.body)) {
    throw new AppError('INVALID_REQUEST', '请求体必须是 JSON 对象', 400);
  }
  return request.body as JsonRecord;
}
