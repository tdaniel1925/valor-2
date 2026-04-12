import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeAuthorizationCode,
  refreshAccessToken,
  TokenRequest,
} from '@/lib/sso/oauth-server';
import { createLogger } from '@/lib/logging/logger';
import { getRequestId } from '@/lib/logging/request-id';

/**
 * POST /api/oauth/token
 * OAuth2 token endpoint
 *
 * Exchange authorization code for access token or refresh an existing token
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/oauth/token',
  });

  try {
    // Parse form data or JSON
    const contentType = request.headers.get('content-type') || '';
    let params: TokenRequest;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      params = {
        grant_type: formData.get('grant_type') as string,
        code: formData.get('code') as string || undefined,
        redirect_uri: formData.get('redirect_uri') as string || undefined,
        client_id: formData.get('client_id') as string,
        client_secret: formData.get('client_secret') as string,
        refresh_token: formData.get('refresh_token') as string || undefined,
        code_verifier: formData.get('code_verifier') as string || undefined,
      };
    } else {
      params = await request.json();
    }

    logger.info('Token request', {
      grant_type: params.grant_type,
      client_id: params.client_id,
    });

    let result;

    if (params.grant_type === 'authorization_code') {
      result = await exchangeAuthorizationCode(params);
    } else if (params.grant_type === 'refresh_token') {
      result = await refreshAccessToken(params);
    } else {
      logger.warn('Unsupported grant type', { grant_type: params.grant_type });
      return NextResponse.json(
        { error: 'unsupported_grant_type' },
        { status: 400 }
      );
    }

    if ('error' in result) {
      logger.warn('Token request failed', { error: result.error });
      return NextResponse.json(result, { status: 400 });
    }

    logger.info('Token issued successfully', {
      grant_type: params.grant_type,
      client_id: params.client_id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Token endpoint error', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
