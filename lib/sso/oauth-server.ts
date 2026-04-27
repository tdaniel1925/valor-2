import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import {
  createAccessToken,
  createAuthorizationCode as generateCode,
  createRefreshToken as generateRefreshToken,
  verifyClientSecret,
  JWTPayload,
} from './jwt';

export interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export interface TokenRequest {
  grant_type: string;
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  code_verifier?: string;
}

/**
 * Verify RFC 7636 PKCE code_verifier against a stored code_challenge.
 * S256: BASE64URL(SHA256(code_verifier)) must equal code_challenge.
 * plain: code_verifier must equal code_challenge.
 */
function verifyPKCE(codeVerifier: string, codeChallenge: string, method: string | null): boolean {
  if (method === 'S256') {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return hash === codeChallenge;
  }
  // plain (and unset, treated as plain)
  return codeVerifier === codeChallenge;
}

/**
 * Validate authorization request parameters
 */
export async function validateAuthorizationRequest(
  params: AuthorizationRequest
): Promise<{ valid: boolean; error?: string; client?: any }> {
  // Check response_type
  if (params.response_type !== 'code') {
    return { valid: false, error: 'unsupported_response_type' };
  }

  // Get client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: params.client_id },
    include: { tenant: true },
  });

  if (!client || !client.isActive) {
    return { valid: false, error: 'invalid_client' };
  }

  // Check redirect URI
  if (!client.redirectUris.includes(params.redirect_uri)) {
    return { valid: false, error: 'invalid_redirect_uri' };
  }

  // Check grant type
  if (!client.grantTypes.includes('authorization_code')) {
    return { valid: false, error: 'unsupported_grant_type' };
  }

  return { valid: true, client };
}

/**
 * Create authorization code
 */
export async function createAuthorizationCode(
  clientId: string,
  userId: string,
  redirectUri: string,
  scope: string,
  codeChallenge?: string,
  codeChallengeMethod?: string
): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.oAuthAuthorizationCode.create({
    data: {
      id: crypto.randomUUID(),
      code,
      clientId,
      userId,
      scope,
      redirectUri,
      codeChallenge: codeChallenge || null,
      codeChallengeMethod: codeChallengeMethod || null,
      expiresAt,
    },
  });

  return code;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeAuthorizationCode(
  params: TokenRequest
): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string } | { error: string }> {
  if (params.grant_type !== 'authorization_code') {
    return { error: 'unsupported_grant_type' };
  }

  if (!params.code || !params.redirect_uri) {
    return { error: 'invalid_request' };
  }

  // Get client and verify secret
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: params.client_id },
  });

  if (!client) {
    return { error: 'invalid_client' };
  }

  const secretValid = await verifyClientSecret(params.client_secret, client.clientSecret);
  if (!secretValid) {
    return { error: 'invalid_client' };
  }

  // Get authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code: params.code },
    include: { user: true },
  });

  if (!authCode) {
    return { error: 'invalid_grant' };
  }

  // Check if already used
  if (authCode.usedAt) {
    return { error: 'invalid_grant' };
  }

  // Check expiration
  if (authCode.expiresAt < new Date()) {
    return { error: 'invalid_grant' };
  }

  // Check redirect URI matches
  if (authCode.redirectUri !== params.redirect_uri) {
    return { error: 'invalid_grant' };
  }

  // Check client ID matches
  if (authCode.clientId !== params.client_id) {
    return { error: 'invalid_grant' };
  }

  // Verify PKCE code_verifier if a code_challenge was stored (RFC 7636)
  if (authCode.codeChallenge) {
    if (!params.code_verifier) {
      return { error: 'invalid_grant' };
    }
    if (!verifyPKCE(params.code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod)) {
      return { error: 'invalid_grant' };
    }
  }

  // Mark code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { code: params.code },
    data: { usedAt: new Date() },
  });

  // Create access token
  const accessToken = await createAccessToken(
    {
      sub: authCode.userId,
      email: authCode.user.email,
      tenant_id: authCode.user.tenantId,
      role: authCode.user.role,
      scope: authCode.scope,
      client_id: params.client_id,
    },
    client.accessTokenTTL
  );

  // Create refresh token
  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = new Date(Date.now() + client.refreshTokenTTL * 1000);

  // Store tokens
  await prisma.oAuthToken.create({
    data: {
      id: crypto.randomUUID(),
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      clientId: params.client_id,
      userId: authCode.userId,
      scope: authCode.scope,
      accessTokenExpiresAt: new Date(Date.now() + client.accessTokenTTL * 1000),
      refreshTokenExpiresAt,
    },
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: client.accessTokenTTL,
    token_type: 'Bearer',
  };
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(
  params: TokenRequest
): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string } | { error: string }> {
  if (params.grant_type !== 'refresh_token') {
    return { error: 'unsupported_grant_type' };
  }

  if (!params.refresh_token) {
    return { error: 'invalid_request' };
  }

  // Verify client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: params.client_id },
  });

  if (!client) {
    return { error: 'invalid_client' };
  }

  const secretValid = await verifyClientSecret(params.client_secret, client.clientSecret);
  if (!secretValid) {
    return { error: 'invalid_client' };
  }

  // Get token
  const tokenRecord = await prisma.oAuthToken.findUnique({
    where: { refreshToken: params.refresh_token },
    include: { user: true },
  });

  if (!tokenRecord) {
    return { error: 'invalid_grant' };
  }

  // Check if revoked
  if (tokenRecord.revoked) {
    return { error: 'invalid_grant' };
  }

  // Check expiration
  if (tokenRecord.refreshTokenExpiresAt && tokenRecord.refreshTokenExpiresAt < new Date()) {
    return { error: 'invalid_grant' };
  }

  // Create new access token
  const accessToken = await createAccessToken(
    {
      sub: tokenRecord.userId,
      email: tokenRecord.user.email,
      tenant_id: tokenRecord.user.tenantId,
      role: tokenRecord.user.role,
      scope: tokenRecord.scope,
      client_id: params.client_id,
    },
    client.accessTokenTTL
  );

  // Update token record
  await prisma.oAuthToken.update({
    where: { id: tokenRecord.id },
    data: {
      accessToken,
      accessTokenExpiresAt: new Date(Date.now() + client.accessTokenTTL * 1000),
    },
  });

  return {
    access_token: accessToken,
    refresh_token: params.refresh_token, // Return same refresh token
    expires_in: client.accessTokenTTL,
    token_type: 'Bearer',
  };
}

/**
 * Get user info from access token
 */
export async function getUserInfo(accessToken: string): Promise<any | null> {
  const tokenRecord = await prisma.oAuthToken.findUnique({
    where: { accessToken },
    include: {
      user: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!tokenRecord || tokenRecord.revoked) {
    return null;
  }

  if (tokenRecord.accessTokenExpiresAt < new Date()) {
    return null;
  }

  const scopes = tokenRecord.scope.split(' ');
  const userInfo: any = {
    sub: tokenRecord.userId,
  };

  if (scopes.includes('openid')) {
    userInfo.email_verified = tokenRecord.user.emailVerified;
  }

  if (scopes.includes('profile')) {
    userInfo.name = `${tokenRecord.user.firstName} ${tokenRecord.user.lastName}`;
    userInfo.given_name = tokenRecord.user.firstName;
    userInfo.family_name = tokenRecord.user.lastName;
    userInfo.picture = tokenRecord.user.profilePhoto;
  }

  if (scopes.includes('email')) {
    userInfo.email = tokenRecord.user.email;
  }

  // Custom scopes
  if (scopes.includes('tenant')) {
    userInfo.tenant = {
      id: tokenRecord.user.tenant.id,
      name: tokenRecord.user.tenant.name,
      slug: tokenRecord.user.tenant.slug,
    };
  }

  if (scopes.includes('role')) {
    userInfo.role = tokenRecord.user.role;
  }

  return userInfo;
}
