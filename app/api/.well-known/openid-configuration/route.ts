import { NextResponse } from 'next/server';

/**
 * GET /.well-known/openid-configuration
 * OpenID Connect Discovery endpoint
 *
 * Provides metadata about this OAuth2/OIDC provider
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://valorfs.app';

  const config = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/oauth/userinfo`,
    jwks_uri: `${baseUrl}/api/oauth/jwks`,
    registration_endpoint: `${baseUrl}/api/oauth/register`,

    scopes_supported: [
      'openid',
      'profile',
      'email',
      'tenant',
      'role',
      'commissions',
      'cases',
    ],

    response_types_supported: ['code'],

    grant_types_supported: [
      'authorization_code',
      'refresh_token',
    ],

    subject_types_supported: ['public'],

    id_token_signing_alg_values_supported: ['HS256'],

    token_endpoint_auth_methods_supported: [
      'client_secret_post',
      'client_secret_basic',
    ],

    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'email',
      'email_verified',
      'name',
      'given_name',
      'family_name',
      'picture',
      'role',
      'tenant',
    ],

    code_challenge_methods_supported: ['S256', 'plain'],
  };

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
