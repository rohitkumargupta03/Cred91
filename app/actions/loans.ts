"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateReference } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * Process an EMI payment (mock payment flow)
 * Creates a Transaction, updates EMI status, and recalculates loan balance
 */
export async function payEMI(
  loanId: string,
  emiId: string,
  method: string = "ONLINE"
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get the EMI and verify it belongs to the user's loan
    const emi = await prisma.eMI.findUnique({
      where: { id: emiId },
      include: {
        loan: {
          include: {
            application: { select: { userId: true } },
          },
        },
      },
    });

    if (!emi) {
      return { success: false, error: "EMI not found" };
    }

    if (emi.loan.application.userId !== session.userId && session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    if (emi.status === "PAID") {
      return { success: false, error: "This EMI has already been paid" };
    }

    if (emi.loanId !== loanId) {
      return { success: false, error: "EMI does not belong to this loan" };
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        loanId,
        emiId,
        amount: emi.amount,
        method,
        paidAt: new Date(),
        reference: generateReference(),
      },
    });

    // Update EMI status to PAID
    await prisma.eMI.update({
      where: { id: emiId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Recalculate outstanding balance
    // Outstanding = sum of principal components of unpaid EMIs
    const unpaidEMIs = await prisma.eMI.findMany({
      where: {
        loanId,
        status: { not: "PAID" },
      },
    });

    const newOutstanding = unpaidEMIs.reduce(
      (sum, e) => sum + e.principalComponent,
      0
    );

    // Check if all EMIs are paid → close loan
    const allPaid = unpaidEMIs.length === 0;

    await prisma.loan.update({
      where: { id: loanId },
      data: {
        outstandingBalance: Math.round(newOutstanding * 100) / 100,
        status: allPaid ? "CLOSED" : undefined,
        closedAt: allPaid ? new Date() : undefined,
      },
    });

    revalidatePath(`/dashboard/loans/${loanId}`);
    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Payment failed:", err);
    return { success: false, error: "Payment processing failed. Please try again." };
  }
}

/**
 * Admin: Add delinquency follow-up notes to a loan
 */
export async function updateDelinquencyNotes(
  loanId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.loan.update({
      where: { id: loanId },
      data: { delinquentNotes: notes },
    });

    revalidatePath("/admin/delinquent");
    return { success: true };
  } catch (err) {
    console.error("Failed to update notes:", err);
    return { success: false, error: "Failed to update notes" };
  }
}

/**
 * Admin: Add escrow entry for a loan
 */
export async function addEscrowEntry(
  loanId: string,
  type: "DEPOSIT" | "WITHDRAWAL",
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      select: { escrowBalance: true },
    });

    if (!loan) {
      return { success: false, error: "Loan not found" };
    }

    const newBalance =
      type === "DEPOSIT"
        ? loan.escrowBalance + amount
        : loan.escrowBalance - amount;

    if (newBalance < 0) {
      return { success: false, error: "Insufficient escrow balance" };
    }

    await prisma.escrowEntry.create({
      data: {
        loanId,
        type,
        amount,
        description: description || null,
        balanceAfter: newBalance,
      },
    });

    await prisma.loan.update({
      where: { id: loanId },
      data: { escrowBalance: newBalance },
    });

    revalidatePath(`/dashboard/loans/${loanId}/escrow`);
    return { success: true };
  } catch (err) {
    console.error("Failed to add escrow entry:", err);
    return { success: false, error: "Failed to add escrow entry" };
  }
}
