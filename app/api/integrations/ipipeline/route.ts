import { NextRequest, NextResponse } from "next/server";
import { iPipelineSAMLClient } from "@/lib/integrations/ipipeline/saml";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/integrations/ipipeline
 *
 * Returns iPipeline SAML SSO integration status
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication to view integration status
    await requireAuth(request);

    const enabled = process.env.IPIPELINE_SSO_ENABLED === "true";
    const configured = iPipelineSAMLClient.isConfigured();
    const environment = process.env.IPIPELINE_ENVIRONMENT || "uat";

    // SECURITY: Don't expose sensitive configuration details like entityId
    return NextResponse.json({
      enabled,
      configured,
      environment,
      products: ["igo", "lifepipe", "formspipe", "xrae", "productinfo"],
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to get iPipeline status' },
      { status: 500 }
    );
  }
}
