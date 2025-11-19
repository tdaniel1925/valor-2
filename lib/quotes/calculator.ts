import { prisma } from "@/lib/db/prisma";

/**
 * Quote Calculation Engine
 * Handles premium calculations for life insurance and annuities
 */

// ===== LIFE INSURANCE =====

export interface LifeInsuranceQuoteInput {
  productType: "TERM" | "WHOLE_LIFE" | "UNIVERSAL_LIFE" | "IUL";
  termLength?: number; // For term life (10, 15, 20, 25, 30 years)
  faceAmount: number; // Death benefit
  age: number;
  gender: "M" | "F";
  healthClass: "PREFERRED_PLUS" | "PREFERRED" | "STANDARD_PLUS" | "STANDARD";
  tobaccoUse: boolean;
  state: string;
}

export interface LifeInsuranceQuote {
  productType: string;
  faceAmount: number;
  termLength?: number;
  monthlyPremium: number;
  annualPremium: number;
  totalPremiumOverTerm?: number;
  ratePerThousand: number;
  healthClass: string;
  tobaccoStatus: string;
}

/**
 * Calculate life insurance quote
 */
export function calculateLifeInsuranceQuote(
  input: LifeInsuranceQuoteInput
): LifeInsuranceQuote {
  const {
    productType,
    termLength,
    faceAmount,
    age,
    gender,
    healthClass,
    tobaccoUse,
  } = input;

  // Base rate per $1,000 of coverage
  let baseRate = getBaseRate(productType, age, gender);

  // Adjust for health class
  baseRate *= getHealthClassMultiplier(healthClass);

  // Adjust for tobacco use (+100% for smokers)
  if (tobaccoUse) {
    baseRate *= 2.0;
  }

  // Adjust for term length (longer terms = slightly higher rates)
  if (productType === "TERM" && termLength) {
    baseRate *= getTermLengthMultiplier(termLength);
  }

  // Calculate annual premium
  const unitsOfCoverage = faceAmount / 1000;
  const annualPremium = baseRate * unitsOfCoverage;
  const monthlyPremium = annualPremium / 12;

  // Calculate total premium over term (for term life)
  let totalPremiumOverTerm: number | undefined;
  if (productType === "TERM" && termLength) {
    totalPremiumOverTerm = annualPremium * termLength;
  }

  return {
    productType,
    faceAmount,
    termLength,
    monthlyPremium: Math.round(monthlyPremium * 100) / 100,
    annualPremium: Math.round(annualPremium * 100) / 100,
    totalPremiumOverTerm: totalPremiumOverTerm
      ? Math.round(totalPremiumOverTerm * 100) / 100
      : undefined,
    ratePerThousand: Math.round(baseRate * 100) / 100,
    healthClass,
    tobaccoStatus: tobaccoUse ? "Tobacco" : "Non-Tobacco",
  };
}

/**
 * Get base rate per $1,000 by product type, age, and gender
 */
function getBaseRate(
  productType: string,
  age: number,
  gender: string
): number {
  // Simplified rate table - in production this would come from carrier rate tables
  let baseRate = 0;

  if (productType === "TERM") {
    if (age <= 30) {
      baseRate = gender === "M" ? 0.5 : 0.4;
    } else if (age <= 40) {
      baseRate = gender === "M" ? 0.8 : 0.6;
    } else if (age <= 50) {
      baseRate = gender === "M" ? 1.5 : 1.2;
    } else if (age <= 60) {
      baseRate = gender === "M" ? 3.0 : 2.5;
    } else {
      baseRate = gender === "M" ? 6.0 : 5.0;
    }
  } else if (productType === "WHOLE_LIFE") {
    if (age <= 30) {
      baseRate = gender === "M" ? 12.0 : 10.0;
    } else if (age <= 40) {
      baseRate = gender === "M" ? 18.0 : 15.0;
    } else if (age <= 50) {
      baseRate = gender === "M" ? 28.0 : 23.0;
    } else if (age <= 60) {
      baseRate = gender === "M" ? 42.0 : 35.0;
    } else {
      baseRate = gender === "M" ? 65.0 : 55.0;
    }
  } else if (productType === "UNIVERSAL_LIFE" || productType === "IUL") {
    if (age <= 30) {
      baseRate = gender === "M" ? 8.0 : 6.5;
    } else if (age <= 40) {
      baseRate = gender === "M" ? 12.0 : 10.0;
    } else if (age <= 50) {
      baseRate = gender === "M" ? 20.0 : 16.0;
    } else if (age <= 60) {
      baseRate = gender === "M" ? 32.0 : 26.0;
    } else {
      baseRate = gender === "M" ? 50.0 : 42.0;
    }
  }

  return baseRate;
}

/**
 * Get health class multiplier
 */
function getHealthClassMultiplier(healthClass: string): number {
  const multipliers: Record<string, number> = {
    PREFERRED_PLUS: 0.85,
    PREFERRED: 1.0,
    STANDARD_PLUS: 1.15,
    STANDARD: 1.35,
  };

  return multipliers[healthClass] || 1.0;
}

/**
 * Get term length multiplier
 */
function getTermLengthMultiplier(termLength: number): number {
  const multipliers: Record<number, number> = {
    10: 0.9,
    15: 0.95,
    20: 1.0,
    25: 1.05,
    30: 1.1,
  };

  return multipliers[termLength] || 1.0;
}

// ===== ANNUITIES =====

export interface AnnuityQuoteInput {
  productType: "FIXED" | "VARIABLE" | "INDEXED" | "MYGA" | "SPIA" | "DIA";
  premium: number; // Single premium or periodic premium amount
  age: number;
  deferralYears?: number; // For deferred annuities
  guaranteedRate?: number; // For fixed/MYGA (as decimal, e.g., 0.05 for 5%)
  participationRate?: number; // For indexed annuities
  cappedRate?: number; // Cap on indexed gains
  payoutYears?: number; // For income annuities
}

export interface AnnuityQuote {
  productType: string;
  premium: number;
  guaranteedRate?: number;
  accumulationValue?: number; // Value at end of accumulation period
  monthlyIncome?: number; // For income annuities
  annualIncome?: number;
  lifetimeIncome?: number; // Estimated lifetime payout
  surrenderChargeSchedule?: Array<{ year: number; charge: number }>;
}

/**
 * Calculate annuity quote
 */
export function calculateAnnuityQuote(
  input: AnnuityQuoteInput
): AnnuityQuote {
  const { productType, premium, age, deferralYears, guaranteedRate } = input;

  if (productType === "MYGA" || productType === "FIXED") {
    return calculateFixedAnnuity(input);
  } else if (productType === "INDEXED") {
    return calculateIndexedAnnuity(input);
  } else if (productType === "SPIA") {
    return calculateImmediateAnnuity(input);
  } else if (productType === "DIA") {
    return calculateDeferredIncomeAnnuity(input);
  }

  throw new Error(`Unsupported annuity type: ${productType}`);
}

/**
 * Calculate MYGA / Fixed Annuity
 */
function calculateFixedAnnuity(input: AnnuityQuoteInput): AnnuityQuote {
  const { productType, premium, deferralYears = 5, guaranteedRate = 0.05 } = input;

  // Calculate accumulation value
  const accumulationValue = premium * Math.pow(1 + guaranteedRate, deferralYears);

  // Generate surrender charge schedule (typically 7-10 years)
  const surrenderChargeSchedule = generateSurrenderSchedule(premium, deferralYears);

  return {
    productType,
    premium,
    guaranteedRate,
    accumulationValue: Math.round(accumulationValue * 100) / 100,
    surrenderChargeSchedule,
  };
}

/**
 * Calculate Indexed Annuity
 */
function calculateIndexedAnnuity(input: AnnuityQuoteInput): AnnuityQuote {
  const {
    productType,
    premium,
    deferralYears = 7,
    participationRate = 0.8,
    cappedRate = 0.08,
  } = input;

  // Use conservative average index return of 7% with participation and cap
  const averageIndexReturn = 0.07;
  const effectiveReturn = Math.min(
    averageIndexReturn * participationRate,
    cappedRate
  );

  const accumulationValue = premium * Math.pow(1 + effectiveReturn, deferralYears);

  const surrenderChargeSchedule = generateSurrenderSchedule(premium, deferralYears);

  return {
    productType,
    premium,
    accumulationValue: Math.round(accumulationValue * 100) / 100,
    surrenderChargeSchedule,
  };
}

/**
 * Calculate Single Premium Immediate Annuity (SPIA)
 */
function calculateImmediateAnnuity(input: AnnuityQuoteInput): AnnuityQuote {
  const { productType, premium, age, payoutYears } = input;

  // Calculate monthly income using annuity payout factor
  const payoutFactor = getPayoutFactor(age, payoutYears);
  const monthlyIncome = (premium * payoutFactor) / 12;
  const annualIncome = premium * payoutFactor;

  // Estimate lifetime income (using average life expectancy)
  const lifeExpectancy = 85 - age;
  const lifetimeIncome = annualIncome * lifeExpectancy;

  return {
    productType,
    premium,
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    annualIncome: Math.round(annualIncome * 100) / 100,
    lifetimeIncome: Math.round(lifetimeIncome * 100) / 100,
  };
}

/**
 * Calculate Deferred Income Annuity (DIA)
 */
function calculateDeferredIncomeAnnuity(input: AnnuityQuoteInput): AnnuityQuote {
  const { productType, premium, age, deferralYears = 10 } = input;

  // Calculate future age when income starts
  const incomeStartAge = age + deferralYears;

  // Get payout factor for future age
  const payoutFactor = getPayoutFactor(incomeStartAge, undefined);

  // Income will be higher due to deferral
  const deferralMultiplier = 1 + deferralYears * 0.08;
  const effectivePremium = premium * deferralMultiplier;

  const monthlyIncome = (effectivePremium * payoutFactor) / 12;
  const annualIncome = effectivePremium * payoutFactor;

  const lifeExpectancy = 85 - incomeStartAge;
  const lifetimeIncome = annualIncome * lifeExpectancy;

  return {
    productType,
    premium,
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    annualIncome: Math.round(annualIncome * 100) / 100,
    lifetimeIncome: Math.round(lifetimeIncome * 100) / 100,
  };
}

/**
 * Get annuity payout factor based on age and payout period
 */
function getPayoutFactor(age: number, payoutYears?: number): number {
  // Simplified payout factors - in production use carrier tables
  let factor = 0;

  if (payoutYears) {
    // Period certain payout
    const rate = 0.04; // 4% discount rate
    factor = 1 / ((1 - Math.pow(1 + rate, -payoutYears)) / rate);
  } else {
    // Lifetime payout
    if (age <= 60) {
      factor = 0.05;
    } else if (age <= 65) {
      factor = 0.055;
    } else if (age <= 70) {
      factor = 0.06;
    } else if (age <= 75) {
      factor = 0.07;
    } else {
      factor = 0.08;
    }
  }

  return factor;
}

/**
 * Generate surrender charge schedule
 */
function generateSurrenderSchedule(
  premium: number,
  years: number
): Array<{ year: number; charge: number }> {
  const schedule = [];
  const maxCharge = 0.09; // Start at 9%
  const decrementPerYear = maxCharge / years;

  for (let year = 1; year <= years; year++) {
    const chargePercent = Math.max(0, maxCharge - decrementPerYear * (year - 1));
    const chargeAmount = premium * chargePercent;

    schedule.push({
      year,
      charge: Math.round(chargeAmount * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Save quote to database
 */
export async function saveQuote(
  userId: string,
  quoteData: any,
  quoteResult: any
) {
  return await prisma.quote.create({
    data: {
      userId,
      clientName: quoteData.clientName,
      clientAge: quoteData.age,
      productType: quoteData.productType,
      carrier: quoteData.carrier || "TBD",
      premium: quoteResult.monthlyPremium || quoteResult.premium,
      annualPremium: quoteResult.annualPremium,
      faceAmount: quoteResult.faceAmount,
      termLength: quoteResult.termLength,
      status: "QUOTED",
      quoteData: JSON.stringify({
        input: quoteData,
        result: quoteResult,
      }),
    },
  });
}
