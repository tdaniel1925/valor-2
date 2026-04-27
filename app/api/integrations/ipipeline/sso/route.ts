import { NextRequest, NextResponse } from "next/server";
import { iPipelineSAMLClient } from "@/lib/integrations/ipipeline/saml";
import { IPipelineProduct } from "@/lib/integrations/ipipeline/types";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * POST /api/integrations/ipipeline/sso
 *
 * Generates SAML assertion for iPipeline SSO
 *
 * Request body:
 * {
 *   userId: string,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   product: 'igo' | 'lifepipe' | 'formspipe' | 'xrae' | 'productinfo',
 *   ...optional user data
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   samlResponse: string (base64),
 *   relayState: string,
 *   acsUrl: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    // Check if iPipeline SSO is enabled
    if (process.env.IPIPELINE_SSO_ENABLED !== "true") {
      return NextResponse.json(
        { error: "iPipeline SSO integration is not enabled" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields — use trim() so empty strings are caught the same as missing values
    const missingFields = ['userId', 'firstName', 'lastName', 'email'].filter(
      (f) => !body[f]?.toString().trim()
    );
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing or empty required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate product
    const validProducts: IPipelineProduct[] = ["igo", "lifepipe", "formspipe", "xrae", "productinfo"];
    if (!body.product || !validProducts.includes(body.product)) {
      return NextResponse.json(
        { error: `Invalid product. Must be one of: ${validProducts.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate SAML Response — trim all string fields so iPipeline never receives padded whitespace
    const samlData = await iPipelineSAMLClient.generateSAMLResponse({
      userId: body.userId.trim(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim(),
      middleName: body.middleName,
      phone: body.phone,
      phone2: body.phone2,
      fax: body.fax,
      address1: body.address1,
      address2: body.address2,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      country: body.country,
      brokerDealerNum: body.brokerDealerNum,
      product: body.product,
      clientData: body.clientData,
    });

    return NextResponse.json({
      success: true,
      ...samlData,
      message: "Submit SAMLResponse via form POST to acsUrl",
    });
  } catch (error: unknown) {
    console.error("iPipeline SSO error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate SAML response";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
