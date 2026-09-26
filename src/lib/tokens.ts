import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { required } from './config';
export function confirmationToken() {
  const token = randomBytes(32).toString('hex');
  return { token, hash: tokenHash(token) };
}
export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
export function unsubscribeToken(id: string) {
  return `${id}.${createHmac('sha256', required('TOKEN_SECRET')).update(`unsubscribe:${id}`).digest('hex')}`;
}
export function verifyUnsubscribe(token: string): string | null {
  const [id, signature, extra] = token.split('.');
  if (extra || !/^[a-f0-9-]{36}$/.test(id || '') || !/^[a-f0-9]{64}$/.test(signature || ''))
    return null;
  const expected = unsubscribeToken(id).split('.')[1];
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature)) ? id : null;
}
export function safeSecretEquals(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
