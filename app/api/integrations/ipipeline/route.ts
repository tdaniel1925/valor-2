import { NextResponse } from "next/server";
import { iPipelineSAMLClient } from "@/lib/integrations/ipipeline/saml";

/**
 * GET /api/integrations/ipipeline
 *
 * Returns iPipeline SAML SSO integration status
 */
export async function GET() {
  const enabled = process.env.IPIPELINE_SSO_ENABLED === "true";
  const configured = iPipelineSAMLClient.isConfigured();
  const environment = process.env.IPIPELINE_ENVIRONMENT || "uat";

  return NextResponse.json({
    enabled,
    configured,
    environment,
    gaid: "2717",
    channelName: "VAL",
    entityId: process.env.IPIPELINE_ENTITY_ID || null,
    products: ["igo", "lifepipe", "formspipe", "xrae", "productinfo"],
  });
}
