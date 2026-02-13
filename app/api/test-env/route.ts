import { NextResponse } from 'next/server';

/**
 * TEMPORARY: Test endpoint to verify env vars are loaded
 * DELETE THIS FILE after debugging
 */

function formatPEM(pem: string, type: string): string {
  if (!pem) return '';

  // First, replace escaped \n with actual newlines
  let formatted = pem.replace(/\\n/g, '\n');

  // Remove all existing whitespace
  formatted = formatted.replace(/\s/g, '');

  // Create markers WITHOUT spaces (since we removed all whitespace above)
  const typeNoSpaces = type.replace(/\s/g, '');
  const beginMarker = `-----BEGIN${typeNoSpaces}-----`;
  const endMarker = `-----END${typeNoSpaces}-----`;

  // Extract the base64 content (between BEGIN and END markers)
  let content = formatted;
  if (formatted.includes(beginMarker)) {
    content = formatted.split(beginMarker)[1]?.split(endMarker)[0] || '';
  }

  // Add newlines every 64 characters (standard PEM format)
  const lines = content.match(/.{1,64}/g) || [];

  // Reconstruct proper PEM format (WITH SPACE in markers)
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

export async function GET() {
  const privateKey = process.env.IPIPELINE_SAML_PRIVATE_KEY || '';
  const certificate = process.env.IPIPELINE_SAML_CERTIFICATE || '';

  const formattedKey = formatPEM(privateKey, 'PRIVATE KEY');
  const formattedCert = formatPEM(certificate, 'CERTIFICATE');

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      IPIPELINE_SSO_ENABLED: process.env.IPIPELINE_SSO_ENABLED || 'NOT SET',
      IPIPELINE_ENVIRONMENT: process.env.IPIPELINE_ENVIRONMENT || 'NOT SET',
      IPIPELINE_ENTITY_ID: process.env.IPIPELINE_ENTITY_ID || 'NOT SET',
    },
    privateKey: {
      exists: !!privateKey,
      rawLength: privateKey.length,
      formattedLength: formattedKey.length,
      startsWithRaw: privateKey.substring(0, 50),
      startsWithFormatted: formattedKey.substring(0, 100),
      hasNewlinesInFormatted: formattedKey.includes('\n'),
      lineCount: formattedKey.split('\n').length,
    },
    certificate: {
      exists: !!certificate,
      rawLength: certificate.length,
      formattedLength: formattedCert.length,
      startsWithFormatted: formattedCert.substring(0, 100),
    },
  });
}
