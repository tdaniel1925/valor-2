/**
 * Debug script: Tests WinFlex SSO XML generation locally
 * Run with: npx ts-node scripts/test-winflex-sso.ts
 */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const companyCode = process.env.WINFLEX_COMPANY_CODE || "VALR";
const companyPassword = process.env.WINFLEX_COMPANY_PASSWORD || "z2s8Uup9AcjwpB74dXnv";
const returnUrl = "https://valorfs.app";

console.log("=== WinFlex SSO Debug ===\n");
console.log("Company Code:", companyCode);
console.log("Company Password:", companyPassword);
console.log("Has braces in code?", companyCode.includes("{"));
console.log("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LifeLink xmlns="urn:lifelink-schema">
  <LL LoginType="WF_AGENCY">
    <UserName>${escapeXml("test@valorfs.com")}</UserName>
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
      <FirstName>Test</FirstName>
      <LastName>User</LastName>
      <CompanyName>Valor Financial Specialists</CompanyName>
      <Email>${escapeXml("test@valorfs.com")}</Email>
    </Profile>
  </WinFlex>
</LifeLink>`;

console.log("=== Generated XML ===");
console.log(xml);
console.log("\n=== Posting to WinFlex ===");

async function testSSO() {
  try {
    const response = await fetch("https://www.winflexweb.com/wfw_sso_login.aspx", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `llXML=${encodeURIComponent(xml)}`,
    });

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    const text = await response.text();

    if (text.includes("wfw_home")) {
      console.log("\n✅ SUCCESS - WinFlex accepted the SSO request!");
    } else if (text.includes("Error")) {
      const errorMatch = text.match(/<span[^>]*class="[^"]*error[^"]*"[^>]*>(.*?)<\/span>/i) ||
                         text.match(/LifeLink[^<]*/i);
      console.log("\n❌ ERROR from WinFlex:");
      console.log(errorMatch ? errorMatch[0] : "Unknown error");
    } else {
      console.log("\nResponse (first 500 chars):");
      console.log(text.substring(0, 500));
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testSSO();
