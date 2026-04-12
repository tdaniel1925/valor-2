import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import {
  validateAuthorizationRequest,
  createAuthorizationCode,
  AuthorizationRequest,
} from '@/lib/sso/oauth-server';
import { createLogger } from '@/lib/logging/logger';
import { getRequestId } from '@/lib/logging/request-id';

/**
 * GET /api/oauth/authorize
 * OAuth2 authorization endpoint
 *
 * This is where external apps redirect users to authenticate.
 * User must be logged in to Valor to authorize the app.
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/oauth/authorize',
  });

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const params: AuthorizationRequest = {
      response_type: searchParams.get('response_type') || '',
      client_id: searchParams.get('client_id') || '',
      redirect_uri: searchParams.get('redirect_uri') || '',
      scope: searchParams.get('scope') || 'openid profile email',
      state: searchParams.get('state') || undefined,
      code_challenge: searchParams.get('code_challenge') || undefined,
      code_challenge_method: searchParams.get('code_challenge_method') || undefined,
    };

    logger.info('OAuth authorization request', {
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      scope: params.scope,
    });

    // Validate request
    const validation = await validateAuthorizationRequest(params);
    if (!validation.valid) {
      logger.warn('Invalid authorization request', { error: validation.error });

      // Redirect back with error if we have a valid redirect_uri
      if (params.redirect_uri) {
        const errorUrl = new URL(params.redirect_uri);
        errorUrl.searchParams.set('error', validation.error || 'invalid_request');
        if (params.state) {
          errorUrl.searchParams.set('state', params.state);
        }
        return NextResponse.redirect(errorUrl.toString());
      }

      return NextResponse.json(
        { error: validation.error || 'invalid_request' },
        { status: 400 }
      );
    }

    // Require user authentication
    let user;
    try {
      user = await requireAuth(request);
    } catch (error) {
      // User not logged in - redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('return_to', request.url);
      return NextResponse.redirect(loginUrl.toString());
    }

    logger.info('User authorized OAuth request', {
      userId: user.id,
      clientId: params.client_id,
    });

    // Create authorization code
    const code = await createAuthorizationCode(
      params.client_id,
      user.id,
      params.redirect_uri,
      params.scope!,
      params.code_challenge,
      params.code_challenge_method
    );

    // Redirect back to client with code
    const redirectUrl = new URL(params.redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (params.state) {
      redirectUrl.searchParams.set('state', params.state);
    }

    logger.info('Authorization code issued', {
      userId: user.id,
      clientId: params.client_id,
    });

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    logger.error('OAuth authorization error', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
