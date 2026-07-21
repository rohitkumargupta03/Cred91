/**
 * EMI Calculator for Cred91 LMS
 * 
 * Implements the reducing balance (diminishing balance) method for EMI calculation.
 * This is the standard amortization formula used by banks and financial institutions.
 * 
 * EMI Formula:
 *   EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 * 
 * Where:
 *   P = Principal loan amount
 *   r = Monthly interest rate (annual rate / 12 / 100)
 *   n = Number of monthly installments (tenure in months)
 * 
 * In the reducing balance method:
 * - Interest is calculated on the outstanding principal each month
 * - As principal is repaid, the interest component decreases
 * - The principal component increases over time
 * - Total EMI remains constant throughout the tenure
 */

export interface EMIScheduleEntry {
  emiNumber: number;
  dueDate: Date;
  principalComponent: number;   // Principal portion of this EMI
  interestComponent: number;    // Interest portion of this EMI
  amount: number;               // Total EMI amount (principal + interest)
  outstandingAfter: number;     // Outstanding balance after this EMI
}

export interface EMICalculationResult {
  monthlyEMI: number;
  totalInterest: number;
  totalAmount: number;          // Principal + Total Interest
  schedule: EMIScheduleEntry[];
}

/**
 * Calculate monthly EMI using the standard reducing balance formula.
 * 
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (e.g., 12 for 12%)
 * @param tenureMonths - Loan tenure in months
 * @returns Monthly EMI amount (rounded to 2 decimal places)
 */
export function calculateMonthlyEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  // Convert annual rate to monthly rate as a decimal
  const monthlyRate = annualRate / 12 / 100;

  // Handle edge case: 0% interest rate
  if (monthlyRate === 0) {
    return Math.round((principal / tenureMonths) * 100) / 100;
  }

  // EMI = P × r × (1+r)^n / ((1+r)^n - 1)
  const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);

  return Math.round(emi * 100) / 100;
}

/**
 * Generate a complete EMI amortization schedule using the reducing balance method.
 * 
 * Each month:
 * 1. Interest = Outstanding Balance × Monthly Rate
 * 2. Principal = EMI - Interest
 * 3. New Outstanding = Previous Outstanding - Principal
 * 
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate percentage
 * @param tenureMonths - Loan tenure in months
 * @param startDate - Disbursement date (EMIs start from next month)
 * @returns Complete EMI calculation result with schedule
 */
export function generateEMISchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date = new Date()
): EMICalculationResult {
  const monthlyRate = annualRate / 12 / 100;
  const monthlyEMI = calculateMonthlyEMI(principal, annualRate, tenureMonths);

  const schedule: EMIScheduleEntry[] = [];
  let outstandingBalance = principal;
  let totalInterest = 0;

  for (let i = 1; i <= tenureMonths; i++) {
    // Calculate interest for this month on current outstanding balance
    const interestComponent = Math.round(outstandingBalance * monthlyRate * 100) / 100;

    // Principal component = EMI - Interest (for the last EMI, adjust to clear balance)
    let principalComponent: number;
    let emiAmount: number;

    if (i === tenureMonths) {
      // Last EMI: pay off remaining principal exactly to avoid rounding drift
      principalComponent = Math.round(outstandingBalance * 100) / 100;
      emiAmount = principalComponent + interestComponent;
    } else {
      principalComponent = Math.round((monthlyEMI - interestComponent) * 100) / 100;
      emiAmount = monthlyEMI;
    }

    // Update outstanding balance
    outstandingBalance = Math.round((outstandingBalance - principalComponent) * 100) / 100;
    // Ensure no negative balance due to rounding
    if (outstandingBalance < 0) outstandingBalance = 0;

    totalInterest += interestComponent;

    // Calculate due date: startDate + i months
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    // Set to 5th of the month for cleaner due dates
    dueDate.setDate(5);

    schedule.push({
      emiNumber: i,
      dueDate,
      principalComponent,
      interestComponent,
      amount: Math.round(emiAmount * 100) / 100,
      outstandingAfter: outstandingBalance,
    });
  }

  return {
    monthlyEMI,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round((principal + totalInterest) * 100) / 100,
    schedule,
  };
}

/**
 * Calculate the total interest saved if a loan is prepaid at a given EMI number.
 */
export function calculatePrepaymentSavings(
  schedule: EMIScheduleEntry[],
  prepayAtEMI: number
): number {
  const remainingInterest = schedule
    .filter((entry) => entry.emiNumber > prepayAtEMI)
    .reduce((sum, entry) => sum + entry.interestComponent, 0);

  return Math.round(remainingInterest * 100) / 100;
}
