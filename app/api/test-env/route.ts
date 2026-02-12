import { NextResponse } from 'next/server';

/**
 * TEMPORARY: Test endpoint to verify env vars are loaded
 * DELETE THIS FILE after debugging
 */
export async function GET() {
  const privateKey = process.env.IPIPELINE_SAML_PRIVATE_KEY || '';
  const certificate = process.env.IPIPELINE_SAML_CERTIFICATE || '';

  // Convert escaped \n to actual newlines
  const processedKey = privateKey.replace(/\\n/g, '\n');
  const processedCert = certificate.replace(/\\n/g, '\n');

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
      processedLength: processedKey.length,
      startsWithRaw: privateKey.substring(0, 50),
      startsWithProcessed: processedKey.substring(0, 50),
      hasEscapedNewlines: privateKey.includes('\\n'),
      hasActualNewlines: privateKey.includes('\n'),
    },
    certificate: {
      exists: !!certificate,
      rawLength: certificate.length,
      processedLength: processedCert.length,
      startsWithRaw: certificate.substring(0, 50),
      startsWithProcessed: processedCert.substring(0, 50),
    },
  });
}
