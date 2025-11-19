/**
 * Types for PDF generation
 */

export interface QuotePDFData {
  clientName: string;
  agentName: string;
  agentEmail: string;
  agentPhone?: string;
  quotes: {
    carrierName: string;
    productName: string;
    monthlyPremium: number;
    annualPremium: number;
    faceAmount: number;
    term?: number;
    features?: string[];
  }[];
  quoteDate: string;
  expiresAt: string;
}
