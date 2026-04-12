import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo } from '@/lib/sso/oauth-server';
import { createLogger } from '@/lib/logging/logger';
import { getRequestId } from '@/lib/logging/request-id';

/**
 * GET /api/oauth/userinfo
 * OAuth2 UserInfo endpoint (OpenID Connect)
 *
 * Returns user information based on the access token
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/oauth/userinfo',
  });

  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'invalid_token' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    // Get user info
    const userInfo = await getUserInfo(accessToken);
    if (!userInfo) {
      logger.warn('Invalid or expired access token');
      return NextResponse.json(
        { error: 'invalid_token' },
        { status: 401 }
      );
    }

    logger.info('UserInfo request successful', { sub: userInfo.sub });

    return NextResponse.json(userInfo);
  } catch (error: any) {
    logger.error('UserInfo endpoint error', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
