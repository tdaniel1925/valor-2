/**
 * Token-at-rest hashing for the OAuth/OIDC server.
 *
 * Access and refresh tokens are looked up by exact value, so we never need the
 * plaintext back — we only ever compare. Storing a SHA-256 hash instead of the
 * raw token means a database leak yields nothing usable (the attacker would
 * still need the original token, which only the client holds).
 *
 * On write: store hashToken(token). On lookup: query by hashToken(presented).
 * The token returned to the client is always the plaintext; only the DB copy
 * is hashed.
 */

import crypto from 'crypto';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}
