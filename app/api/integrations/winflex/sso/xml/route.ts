import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/db/prisma";

const WINFLEX_SSO_URL = process.env.WINFLEX_SSO_URL || "https://www.winflexweb.com/wfw_sso_login.aspx";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET /api/integrations/winflex/sso/xml
 *
 * Generates WinFlex SSO XML. Matches the working Apex implementation:
 * - Server-side auth via Supabase
 * - Pulls user data from DB
 * - Returns { xml, ssoUrl }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from Valor DB
    const valorUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!valorUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!process.env.WINFLEX_ENABLED || process.env.WINFLEX_ENABLED !== "true") {
      return NextResponse.json({ error: "WinFlex integration is not enabled" }, { status: 400 });
    }

    const companyCode = process.env.WINFLEX_COMPANY_CODE;
    const companyPassword = process.env.WINFLEX_COMPANY_PASSWORD;

    if (!companyCode || !companyPassword) {
      return NextResponse.json({ error: "WinFlex credentials not configured" }, { status: 500 });
    }

    const returnUrl = process.env.NEXT_PUBLIC_APP_URL || "https://valorfs.app";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LifeLink xmlns="urn:lifelink-schema">
  <LL LoginType="WF_AGENCY">
    <UserName>${escapeXml(valorUser.email)}</UserName>
    <WFCompanyCode>${escapeXml(companyCode)}</WFCompanyCode>
    <WFCompanyPassword>${escapeXml(companyPassword)}</WFCompanyPassword>
    <InterfaceType>GUI</InterfaceType>
    <OutputType>URL</OutputType>
    <Tool>
      <Name>WinFlex</Name>
    </Tool>
  </LL>
  <WinFlex>
    <ReturnURL>${escapeXml(returnUrl)}</ReturnURL>
    <Captive>False</Captive>
    <Profile AutoCreate="true" AutoEmail="false">
      <FirstName>${escapeXml(valorUser.firstName || "")}</FirstName>
      <LastName>${escapeXml(valorUser.lastName || "")}</LastName>
      <CompanyName>Valor Financial Specialists</CompanyName>
      ${valorUser.phone ? `<Phone>${escapeXml(valorUser.phone)}</Phone>` : ""}
      <Email>${escapeXml(valorUser.email)}</Email>
    </Profile>
  </WinFlex>
</LifeLink>`;

    return NextResponse.json({
      xml,
      ssoUrl: WINFLEX_SSO_URL,
    });

  } catch (error: unknown) {
    console.error("WinFlex SSO error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate WinFlex SSO";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
