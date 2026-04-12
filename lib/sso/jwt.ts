import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

// JWT signing secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Convert secret to Uint8Array for jose
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  tenant_id: string;
  role?: string;
  scope?: string;
  client_id?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

/**
 * Create a signed JWT access token
 */
export async function createAccessToken(
  payload: JWTPayload,
  expiresInSeconds: number = 3600
): Promise<string> {
  const jwt = await new jose.SignJWT({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    iss: process.env.NEXT_PUBLIC_APP_URL || 'https://valorfs.app',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .setJti(uuidv4())
    .sign(secretKey);

  return jwt;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Create a refresh token (longer lived, opaque string)
 */
export function createRefreshToken(): string {
  return uuidv4() + uuidv4().replace(/-/g, '');
}

/**
 * Create an authorization code (short-lived)
 */
export function createAuthorizationCode(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Hash a client secret for storage
 */
export async function hashClientSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a client secret against a hash
 */
export async function verifyClientSecret(secret: string, hash: string): Promise<boolean> {
  const computedHash = await hashClientSecret(secret);
  return computedHash === hash;
}

/**
 * Generate a random client ID
 */
export function generateClientId(): string {
  return 'client_' + uuidv4();
}

/**
 * Generate a random client secret
 */
export function generateClientSecret(): string {
  return 'secret_' + uuidv4() + uuidv4().replace(/-/g, '');
}
