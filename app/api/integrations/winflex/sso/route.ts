import { NextRequest, NextResponse } from "next/server";

/**
 * WinFlex SSO Integration
 *
 * This endpoint generates the SSO XML payload and retrieves
 * the redirect URL for WinFlex Web single sign-on.
 *
 * Documentation: Provided by Zinnia (formerly LifeLink Corp)
 * Login Type: WF_AGENCY (agency-level access)
 */

// WinFlex SSO endpoint - per documentation: wfw_sso_login.aspx
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

  // Build profile XML if auto-create is enabled
  let profileXml = "";
  if (params.autoCreate) {
    profileXml = `
    <WinFlex>
      <Profile AutoCreate="true" AutoEmail="false">
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

  // Generate the SSO XML according to WinFlex specification
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
 * POST /api/integrations/winflex/sso
 *
 * Generates SSO credentials and returns the WinFlex redirect URL
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
      autoCreate: body.autoCreate ?? true, // Default to auto-create
    });

    // URL-encode the XML for the llXML parameter (per documentation)
    const encodedXml = encodeURIComponent(ssoXml);

    // POST to WinFlex SSO endpoint with llXML parameter
    const response = await fetch(WINFLEX_SSO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `llXML=${encodedXml}`,
    });

    if (!response.ok) {
      console.error("WinFlex SSO error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to authenticate with WinFlex" },
        { status: 502 }
      );
    }

    // WinFlex returns the redirect URL in the response
    const redirectUrl = await response.text();

    // Validate that we got a URL back
    if (!redirectUrl || !redirectUrl.startsWith("http")) {
      console.error("WinFlex SSO invalid response:", redirectUrl);
      return NextResponse.json(
        { error: "Invalid response from WinFlex", details: redirectUrl },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: redirectUrl.trim(),
      message: "SSO authentication successful. Open URL in new window.",
    });

  } catch (error: any) {
    console.error("WinFlex SSO error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process WinFlex SSO request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/winflex/sso
 *
 * Returns WinFlex integration status
 */
export async function GET() {
  const isEnabled = process.env.WINFLEX_ENABLED === "true";
  const hasCredentials = !!(
    process.env.WINFLEX_COMPANY_CODE &&
    process.env.WINFLEX_COMPANY_PASSWORD
  );

  return NextResponse.json({
    enabled: isEnabled,
    configured: hasCredentials,
    companyCode: process.env.WINFLEX_COMPANY_CODE ?
      `${process.env.WINFLEX_COMPANY_CODE.substring(0, 2)}**` : null,
  });
}
