import { NextRequest, NextResponse } from "next/server";

/**
 * WinFlex SSO XML Generator
 *
 * This endpoint generates the SSO XML payload for browser-based
 * form submission to WinFlex Web.
 *
 * The browser will submit this XML directly to WinFlex (not server-side)
 * per the WinFlex SSO flowchart documentation.
 */

// WinFlex SSO endpoint
const WINFLEX_SSO_URL = process.env.WINFLEX_SSO_URL || "https://www.winflexweb.com/wfw_sso_login.aspx";

interface WinFlexSSORequest {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  autoCreate?: boolean;
}

/**
 * Generate WinFlex SSO XML payload
 */
function generateSSOXml(params: WinFlexSSORequest): string {
  const companyCode = process.env.WINFLEX_COMPANY_CODE;
  const companyPassword = process.env.WINFLEX_COMPANY_PASSWORD;

  if (!companyCode || !companyPassword) {
    throw new Error("WinFlex credentials not configured");
  }

  // Build profile XML for user registration/auto-create
  let profileXml = "";
  if (params.autoCreate) {
    profileXml = `
  <WinFlex>
    <Profile>
      <FirstName>${escapeXml(params.firstName)}</FirstName>
      <LastName>${escapeXml(params.lastName)}</LastName>
      ${params.companyName ? `<CompanyName>${escapeXml(params.companyName)}</CompanyName>` : ""}
      ${params.address1 ? `<Address1>${escapeXml(params.address1)}</Address1>` : ""}
      ${params.city ? `<City>${escapeXml(params.city)}</City>` : ""}
      ${params.state ? `<State>${escapeXml(params.state)}</State>` : ""}
      ${params.zip ? `<Zip>${escapeXml(params.zip)}</Zip>` : ""}
      ${params.phone ? `<Phone>${escapeXml(params.phone)}</Phone>` : ""}
      <Email>${escapeXml(params.email)}</Email>
    </Profile>
  </WinFlex>`;
  }

  // Generate the SSO XML according to WinFlex v1.8 specification
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LifeLink xmlns="urn:lifelink-schema">
  <LL LoginType="WF_AGENCY">
    <UserName>${escapeXml(params.userId)}</UserName>
    <WFCompanyCode>${escapeXml(companyCode)}</WFCompanyCode>
    <WFCompanyPassword>${escapeXml(companyPassword)}</WFCompanyPassword>
    <InterfaceType>GUI</InterfaceType>
    <OutputType>URL</OutputType>
    <Tool>
      <Name>WinFlex</Name>
    </Tool>
  </LL>${profileXml}
</LifeLink>`;

  return xml;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * POST /api/integrations/winflex/sso/xml
 *
 * Generates and returns the SSO XML for browser-based form submission
 */
export async function POST(request: NextRequest) {
  try {
    // Check if WinFlex integration is enabled
    if (process.env.WINFLEX_ENABLED !== "true") {
      return NextResponse.json(
        { error: "WinFlex integration is not enabled" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields: userId, firstName, lastName, email" },
        { status: 400 }
      );
    }

    // Generate the SSO XML
    const ssoXml = generateSSOXml({
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      companyName: body.companyName || "Valor Financial Specialists",
      address1: body.address1,
      city: body.city,
      state: body.state,
      zip: body.zip,
      phone: body.phone,
      autoCreate: body.autoCreate ?? true,
    });

    // Return the XML and SSO URL for browser-based form submission
    return NextResponse.json({
      success: true,
      xml: ssoXml,
      ssoUrl: WINFLEX_SSO_URL,
      message: "Submit this XML via form POST to WinFlex SSO URL",
    });

  } catch (error: any) {
    console.error("WinFlex SSO XML generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate WinFlex SSO XML" },
      { status: 500 }
    );
  }
}
