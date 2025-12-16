import { NextResponse } from "next/server";
import { iPipelineSAMLClient } from "@/lib/integrations/ipipeline/saml";

/**
 * GET /api/integrations/ipipeline/metadata
 *
 * Returns the IdP metadata XML file for iPipeline
 *
 * This is the file you need to send to iPipeline during setup.
 * They use it to:
 * 1. Identify Valor as the Identity Provider
 * 2. Verify SAML response signatures using the certificate
 */
export async function GET() {
  try {
    // Check if certificate is configured
    if (!iPipelineSAMLClient.isConfigured()) {
      return NextResponse.json(
        {
          error: "SAML signing certificate not configured",
          message: "Set IPIPELINE_SAML_CERTIFICATE and IPIPELINE_SAML_PRIVATE_KEY environment variables",
        },
        { status: 400 }
      );
    }

    const metadata = iPipelineSAMLClient.generateIdPMetadata();

    // Return as XML with appropriate headers
    return new NextResponse(metadata, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": 'attachment; filename="valor-idp-metadata.xml"',
      },
    });
  } catch (error: unknown) {
    console.error("iPipeline metadata generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate IdP metadata";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
