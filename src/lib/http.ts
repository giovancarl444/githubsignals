import 'server-only';
import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { appUrl, required } from './config';
import { rpc } from './db';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checkOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(appUrl()).origin)
    throw new HttpError(403, 'This request is not allowed.');
}
export async function readJson(request: Request, max = 16000) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'Use JSON.');
  const text = await request.text();
  if (Buffer.byteLength(text) > max) throw new HttpError(413, 'Request too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export async function rateLimit(request: Request, scope: string, limit = 10) {
  // Vercel overwrites this header. Never trust a user-supplied forwarding header on another host.
  const ip = process.env.VERCEL
    ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    : 'local';
  const key = createHmac('sha256', required('RATE_LIMIT_SECRET'))
    .update(`${scope}:${ip}`)
    .digest('hex');
  if (!(await rpc<boolean>('consume_rate_limit', { p_key: key, p_limit: limit, p_seconds: 3600 })))
    throw new HttpError(429, 'Too many attempts. Please try again later.');
}
export async function verifyBot(token: string, action: string) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: required('TURNSTILE_SECRET_KEY'), response: token }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new HttpError(503, 'Verification is temporarily unavailable.');
  const result = (await response.json()) as {
    success: boolean;
    hostname?: string;
    action?: string;
  };
  if (!result.success || result.hostname !== new URL(appUrl()).hostname || result.action !== action)
    throw new HttpError(400, 'Please complete the verification and try again.');
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || 'Check your details.' },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  console.error('request_failed', { type: error instanceof Error ? error.name : 'unknown' });
  return NextResponse.json(
    { error: 'We could not complete your request. Please try again shortly.' },
    { status: 503 },
  );
}
