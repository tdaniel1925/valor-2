import { XMLParser } from "fast-xml-parser";

// ============================================
// FireLight NVP XML Parser
// ============================================

export interface ParsedFireLightSubmission {
  transactionId: string;
  applicationId: string;
  dti: string | null;
  transactionDateTime: string | null;
  dataItems: Record<string, string>;
  forms: string[];
  pdfs: Buffer[];
}

export interface MappedCaseData {
  // Agent info
  agentFirstName: string | null;
  agentLastName: string | null;
  agentSsn: string | null;
  agentIdNumber: string | null;
  agentCommissionSplit: string | null;

  // Client/Owner info
  clientFirstName: string | null;
  clientLastName: string | null;
  clientDob: string | null;
  clientEmail: string | null;
  clientSsn: string | null;
  clientPhone: string | null;
  clientAddress: {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };

  // Annuitant info (may differ from owner)
  annuitantFirstName: string | null;
  annuitantLastName: string | null;
  annuitantDob: string | null;
  annuitantSsn: string | null;

  // Product info
  productName: string | null;
  productType: string | null;
  investmentAmount: number | null;

  // Beneficiary info
  primaryBeneficiaryName: string | null;
  primaryBeneficiaryRelation: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false, // Keep everything as strings
  isArray: (tagName) => {
    // Force arrays for list items so we handle single-item lists correctly
    return ["DataItem", "Form", "PDF"].includes(tagName);
  },
});

/**
 * Parse raw FireLight NVP XML into structured data
 */
export function parseFireLightXml(xml: string): ParsedFireLightSubmission {
  const parsed = parser.parse(xml);
  const root = parsed.DataFeedObject;

  if (!root) {
    throw new Error("Invalid FireLight XML: missing DataFeedObject root element");
  }

  // Extract DataItems into a flat key-value map (only items with values)
  const dataItems: Record<string, string> = {};
  const items = root.DataItems?.DataItem ?? [];
  for (const item of items) {
    if (item.Name && item.Value !== undefined && item.Value !== null && item.Value !== "") {
      dataItems[item.Name] = String(item.Value);
    }
  }

  // Extract form names
  const forms: string[] = [];
  const formList = root.FormList?.Form ?? [];
  for (const form of formList) {
    if (form.FormName) {
      forms.push(String(form.FormName));
    }
  }

  // Extract PDF binary data
  const pdfs: Buffer[] = [];
  const pdfList = root.PDFList?.PDF ?? [];
  for (const pdf of pdfList) {
    if (pdf.PDFData) {
      pdfs.push(Buffer.from(String(pdf.PDFData), "base64"));
    }
  }

  return {
    transactionId: String(root.TransactionID ?? ""),
    applicationId: String(root.ApplicationID ?? ""),
    dti: root.DTI ? String(root.DTI) : null,
    transactionDateTime: root.TransactionDateTime ? String(root.TransactionDateTime) : null,
    dataItems,
    forms,
    pdfs,
  };
}

/**
 * Map NVP field names to structured Valor case data
 */
export function mapToCase(dataItems: Record<string, string>): MappedCaseData {
  const get = (key: string): string | null => dataItems[key] ?? null;
  const getFloat = (key: string): number | null => {
    const val = dataItems[key];
    if (!val) return null;
    const num = parseFloat(val.replace(/[,$]/g, ""));
    return isNaN(num) ? null : num;
  };

  return {
    agentFirstName: get("Agent_FirstName"),
    agentLastName: get("Agent_LastName"),
    agentSsn: get("Agent_SSN"),
    agentIdNumber: get("BDAgent_IDNumber"),
    agentCommissionSplit: get("Agent_CommissionSplit"),

    clientFirstName: get("Client_FirstName") ?? get("Owner_FirstName"),
    clientLastName: get("Client_LastName") ?? get("Owner_LastName"),
    clientDob: get("Client_DOB") ?? get("Owner_DOB"),
    clientEmail: get("Client_EmailAddress") ?? get("Owner_EmailAddress"),
    clientSsn: get("Client_SSN") ?? get("Owner_SSN"),
    clientPhone: get("Client_PhoneNumber") ?? get("Owner_PhoneNumber"),
    clientAddress: {
      street: get("Client_ResidentialAddress1") ?? get("Owner_ResidentialAddress1"),
      city: get("Client_ResidentialAddress_City") ?? get("Owner_ResidentialAddress_City"),
      state: get("Client_ResidentialAddress_State") ?? get("Owner_ResidentialAddress_State"),
      zip: get("Client_ResidentialAddress_Zipcode") ?? get("Owner_ResidentialAddress_Zipcode"),
    },

    annuitantFirstName: get("Annuitant_FirstName"),
    annuitantLastName: get("Annuitant_LastName"),
    annuitantDob: get("Annuitant_DOB"),
    annuitantSsn: get("Annuitant_SSN"),

    productName: get("ProductName") ?? get("Product_Name"),
    productType: get("ProductType") ?? get("Product_Type"),
    investmentAmount: getFloat("AmountOfInvestment"),

    primaryBeneficiaryName: get("PrimaryBeneficiary_FirstName") && get("PrimaryBeneficiary_LastName")
      ? `${get("PrimaryBeneficiary_FirstName")} ${get("PrimaryBeneficiary_LastName")}`
      : null,
    primaryBeneficiaryRelation: get("PrimaryBeneficiary_Relationship"),
  };
}

/**
 * Get a display-friendly primary insured name from the mapped data
 */
export function getPrimaryInsuredName(mapped: MappedCaseData): string | null {
  // Prefer client/owner name, fall back to annuitant
  const first = mapped.clientFirstName ?? mapped.annuitantFirstName;
  const last = mapped.clientLastName ?? mapped.annuitantLastName;
  if (first && last) return `${first} ${last}`;
  if (last) return last;
  return null;
}

/**
 * Get a display-friendly advisor name from the mapped data
 */
export function getAdvisorName(mapped: MappedCaseData): string | null {
  if (mapped.agentFirstName && mapped.agentLastName) {
    return `${mapped.agentFirstName} ${mapped.agentLastName}`;
  }
  if (mapped.agentLastName) return mapped.agentLastName;
  return null;
}
