/**
 * Overdue & Delinquency Detection for Cred91 LMS
 * 
 * Logic:
 * 1. EMIs past due date with status DUE → mark OVERDUE
 * 2. Loans with 3+ consecutive OVERDUE EMIs → flag as DELINQUENT
 * 
 * This runs on page load for the prototype (could be a cron job in production).
 */
import { prisma } from "./prisma";

/**
 * Check and update overdue EMIs and delinquent loans.
 * Call this on dashboard page load to ensure statuses are current.
 */
export async function checkOverdueAndDelinquency(): Promise<{
  overdueCount: number;
  delinquentCount: number;
}> {
  const now = new Date();
  let overdueCount = 0;
  let delinquentCount = 0;

  // Step 1: Find all DUE EMIs where dueDate has passed → mark as OVERDUE
  const overdueResult = await prisma.eMI.updateMany({
    where: {
      status: "DUE",
      dueDate: {
        lt: now,
      },
    },
    data: {
      status: "OVERDUE",
    },
  });
  overdueCount = overdueResult.count;

  // Step 2: Check for delinquent loans
  // A loan is DELINQUENT if it has 3 or more consecutive OVERDUE EMIs
  const activeLoans = await prisma.loan.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      emis: {
        orderBy: { emiNumber: "asc" },
      },
    },
  });

  for (const loan of activeLoans) {
    let consecutiveOverdue = 0;
    let maxConsecutiveOverdue = 0;

    for (const emi of loan.emis) {
      if (emi.status === "OVERDUE") {
        consecutiveOverdue++;
        maxConsecutiveOverdue = Math.max(maxConsecutiveOverdue, consecutiveOverdue);
      } else {
        consecutiveOverdue = 0;
      }
    }

    // Flag as DELINQUENT if 3+ consecutive overdue EMIs
    if (maxConsecutiveOverdue >= 3 && loan.status !== "DELINQUENT") {
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: "DELINQUENT" },
      });
      delinquentCount++;
    }
  }

  return { overdueCount, delinquentCount };
}

/**
 * Get overdue summary for a specific loan
 */
export async function getLoanOverdueSummary(loanId: string) {
  const emis = await prisma.eMI.findMany({
    where: { loanId },
    orderBy: { emiNumber: "asc" },
  });

  const overdueEMIs = emis.filter((e) => e.status === "OVERDUE");
  const paidEMIs = emis.filter((e) => e.status === "PAID");
  const dueEMIs = emis.filter((e) => e.status === "DUE");

  const totalOverdueAmount = overdueEMIs.reduce((sum, e) => sum + e.amount, 0);

  return {
    totalEMIs: emis.length,
    paidCount: paidEMIs.length,
    dueCount: dueEMIs.length,
    overdueCount: overdueEMIs.length,
    totalOverdueAmount,
    nextDueEMI: dueEMIs[0] || null,
    nextOverdueEMI: overdueEMIs[0] || null,
  };
}
