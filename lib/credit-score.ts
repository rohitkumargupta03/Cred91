/**
 * Credit Scoring Engine for Cred91 LMS
 * 
 * Generates a credit score (300-900) based on multiple weighted factors.
 * This is a simplified, rule-based scoring model for the prototype.
 * 
 * Factors and weights:
 * - Income-to-Loan ratio:    40%  (higher ratio = better score)
 * - Employment stability:    20%  (more years = better score)
 * - Loan tenure fit:         15%  (moderate tenure preferred)
 * - Employment type:         15%  (salaried > business > self-employed)
 * - Debt-to-Income estimate: 10%  (lower estimated DTI = better)
 */

export interface CreditScoreInput {
  monthlyIncome: number;
  loanAmount: number;
  tenure: number;           // months
  employmentType: string;   // SALARIED | SELF_EMPLOYED | BUSINESS
  yearsEmployed: number;
}

export interface CreditScoreResult {
  score: number;            // 300-900
  category: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  factors: CreditScoreFactor[];
  eligible: boolean;
  maxRecommendedAmount: number;
}

export interface CreditScoreFactor {
  name: string;
  score: number;       // 0-100
  weight: number;      // percentage weight
  impact: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  detail: string;
}

const SCORE_MIN = 300;
const SCORE_MAX = 900;
const SCORE_RANGE = SCORE_MAX - SCORE_MIN;

/**
 * Calculate credit score based on applicant data
 */
export function calculateCreditScore(input: CreditScoreInput): CreditScoreResult {
  const factors: CreditScoreFactor[] = [];

  // ─── Factor 1: Income-to-Loan Ratio (40% weight) ───
  // Measures how many months of income cover the loan amount
  const incomeToLoanRatio = (input.monthlyIncome * 12) / input.loanAmount;
  let incomeScore: number;

  if (incomeToLoanRatio >= 5) {
    incomeScore = 95;      // Excellent: annual income is 5x+ the loan
  } else if (incomeToLoanRatio >= 3) {
    incomeScore = 80;      // Good: 3-5x
  } else if (incomeToLoanRatio >= 2) {
    incomeScore = 65;      // Fair: 2-3x
  } else if (incomeToLoanRatio >= 1) {
    incomeScore = 45;      // Below average: 1-2x
  } else {
    incomeScore = 20;      // Poor: loan exceeds annual income
  }

  factors.push({
    name: "Income-to-Loan Ratio",
    score: incomeScore,
    weight: 40,
    impact: incomeScore >= 65 ? "POSITIVE" : incomeScore >= 45 ? "NEUTRAL" : "NEGATIVE",
    detail: `Annual income is ${incomeToLoanRatio.toFixed(1)}x the loan amount`,
  });

  // ─── Factor 2: Employment Stability (20% weight) ───
  // Longer employment = more stable = better score
  let employmentScore: number;

  if (input.yearsEmployed >= 10) {
    employmentScore = 95;
  } else if (input.yearsEmployed >= 5) {
    employmentScore = 80;
  } else if (input.yearsEmployed >= 3) {
    employmentScore = 65;
  } else if (input.yearsEmployed >= 1) {
    employmentScore = 45;
  } else {
    employmentScore = 25;
  }

  factors.push({
    name: "Employment Stability",
    score: employmentScore,
    weight: 20,
    impact: employmentScore >= 65 ? "POSITIVE" : employmentScore >= 45 ? "NEUTRAL" : "NEGATIVE",
    detail: `${input.yearsEmployed} years of employment experience`,
  });

  // ─── Factor 3: Loan Tenure Appropriateness (15% weight) ───
  // Moderate tenure (12-60 months) is ideal; very short or very long is riskier
  let tenureScore: number;

  if (input.tenure >= 12 && input.tenure <= 60) {
    tenureScore = 85;      // Sweet spot
  } else if (input.tenure >= 6 && input.tenure <= 84) {
    tenureScore = 70;      // Acceptable
  } else if (input.tenure > 84) {
    tenureScore = 45;      // Long tenure = more risk
  } else {
    tenureScore = 55;      // Very short tenure = high EMI burden
  }

  factors.push({
    name: "Loan Tenure Fit",
    score: tenureScore,
    weight: 15,
    impact: tenureScore >= 70 ? "POSITIVE" : tenureScore >= 55 ? "NEUTRAL" : "NEGATIVE",
    detail: `${input.tenure} months tenure ${input.tenure >= 12 && input.tenure <= 60 ? "(optimal range)" : ""}`,
  });

  // ─── Factor 4: Employment Type (15% weight) ───
  // Salaried employees have more stable income, thus lower risk
  let typeScore: number;

  switch (input.employmentType) {
    case "SALARIED":
      typeScore = 90;
      break;
    case "BUSINESS":
      typeScore = 70;
      break;
    case "SELF_EMPLOYED":
      typeScore = 55;
      break;
    default:
      typeScore = 40;
  }

  factors.push({
    name: "Employment Type",
    score: typeScore,
    weight: 15,
    impact: typeScore >= 70 ? "POSITIVE" : typeScore >= 55 ? "NEUTRAL" : "NEGATIVE",
    detail: `${input.employmentType.replace("_", " ").toLowerCase()} employment`,
  });

  // ─── Factor 5: Debt-to-Income Estimate (10% weight) ───
  // Estimated EMI as a percentage of monthly income
  // Using simple EMI estimation: loan / tenure
  const estimatedEMI = input.loanAmount / input.tenure;
  const dtiRatio = (estimatedEMI / input.monthlyIncome) * 100;
  let dtiScore: number;

  if (dtiRatio <= 20) {
    dtiScore = 95;         // Very comfortable
  } else if (dtiRatio <= 35) {
    dtiScore = 75;         // Manageable
  } else if (dtiRatio <= 50) {
    dtiScore = 50;         // Stretched
  } else {
    dtiScore = 20;         // Over-leveraged
  }

  factors.push({
    name: "Debt-to-Income Ratio",
    score: dtiScore,
    weight: 10,
    impact: dtiScore >= 70 ? "POSITIVE" : dtiScore >= 50 ? "NEUTRAL" : "NEGATIVE",
    detail: `Estimated EMI is ${dtiRatio.toFixed(0)}% of monthly income`,
  });

  // ─── Calculate Weighted Score ───
  const weightedTotal = factors.reduce(
    (sum, factor) => sum + (factor.score * factor.weight) / 100,
    0
  );

  // Map 0-100 weighted score to 300-900 range
  const finalScore = Math.round(SCORE_MIN + (weightedTotal / 100) * SCORE_RANGE);
  const clampedScore = Math.max(SCORE_MIN, Math.min(SCORE_MAX, finalScore));

  // ─── Determine Category ───
  let category: CreditScoreResult["category"];
  if (clampedScore >= 750) {
    category = "EXCELLENT";
  } else if (clampedScore >= 650) {
    category = "GOOD";
  } else if (clampedScore >= 550) {
    category = "FAIR";
  } else {
    category = "POOR";
  }

  // ─── Max Recommended Loan Amount ───
  // Based on 50% of annual income as max loan for good scores,
  // scaled down for lower scores
  const scoreMultiplier = (clampedScore - SCORE_MIN) / SCORE_RANGE;
  const maxRecommendedAmount = Math.round(
    input.monthlyIncome * 12 * 0.5 * (0.5 + scoreMultiplier * 0.5)
  );

  return {
    score: clampedScore,
    category,
    factors,
    eligible: clampedScore >= 500,
    maxRecommendedAmount,
  };
}

/**
 * Get color class for credit score category
 */
export function getCreditScoreColor(score: number): string {
  if (score >= 750) return "text-emerald-600";
  if (score >= 650) return "text-blue-600";
  if (score >= 550) return "text-amber-600";
  return "text-red-600";
}

/**
 * Get background color class for credit score category
 */
export function getCreditScoreBgColor(score: number): string {
  if (score >= 750) return "bg-emerald-50 border-emerald-200";
  if (score >= 650) return "bg-blue-50 border-blue-200";
  if (score >= 550) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}
