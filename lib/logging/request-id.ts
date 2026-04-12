/**
 * Request ID middleware for tracking requests across logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return nanoid(16);
}

/**
 * Get request ID from request headers or generate a new one
 */
export function getRequestId(request: NextRequest): string {
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  return existingId || generateRequestId();
}

/**
 * Add request ID to response headers
 */
export function addRequestIdToResponse(
  response: NextResponse,
  requestId: string
): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Middleware to add request IDs to all requests
 * Should be added to middleware.ts
 */
export function withRequestId(
  request: NextRequest,
  handler: (requestId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = getRequestId(request);
  return handler(requestId).then((response) => {
    return addRequestIdToResponse(response, requestId);
  });
}
