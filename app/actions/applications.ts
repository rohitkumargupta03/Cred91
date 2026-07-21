"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { applicationSchema, reviewApplicationSchema } from "@/lib/validations";
import { calculateCreditScore } from "@/lib/credit-score";
import { generateEMISchedule } from "@/lib/emi-calculator";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ApplicationState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
} | null;

/**
 * Submit a new loan application
 */
export async function submitApplication(
  _prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const session = await getSession();
  if (!session) {
    return { error: "Please log in to submit an application" };
  }

  const raw = {
    fullName: formData.get("fullName") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
    employmentType: formData.get("employmentType") as string,
    employer: (formData.get("employer") as string) || "",
    monthlyIncome: Number(formData.get("monthlyIncome")),
    yearsEmployed: Number(formData.get("yearsEmployed")),
    amount: Number(formData.get("amount")),
    tenure: Number(formData.get("tenure")),
    purpose: formData.get("purpose") as string,
  };

  const validated = applicationSchema.safeParse(raw);
  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = validated.data;

  // Calculate credit score
  const creditResult = calculateCreditScore({
    monthlyIncome: data.monthlyIncome,
    loanAmount: data.amount,
    tenure: data.tenure,
    employmentType: data.employmentType,
    yearsEmployed: data.yearsEmployed,
  });

  try {
    await prisma.application.create({
      data: {
        userId: session.userId,
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        address: data.address,
        phone: data.phone,
        employmentType: data.employmentType,
        employer: data.employer || null,
        monthlyIncome: data.monthlyIncome,
        yearsEmployed: data.yearsEmployed,
        amount: data.amount,
        tenure: data.tenure,
        purpose: data.purpose,
        creditScore: creditResult.score,
        status: "PENDING",
      },
    });
  } catch (err) {
    console.error("Failed to create application:", err);
    return { error: "Failed to submit application. Please try again." };
  }

  revalidatePath("/dashboard/applications");
  redirect("/dashboard/applications");
}

/**
 * Upload documents for an application
 */
export async function uploadDocument(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const applicationId = formData.get("applicationId") as string;
  const docType = formData.get("type") as string;
  const file = formData.get("file") as File;

  if (!applicationId || !docType || !file) {
    return { success: false, error: "Missing required fields" };
  }

  // Verify application belongs to user
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.userId },
  });

  if (!application) {
    return { success: false, error: "Application not found" };
  }

  // Save file reference (mock storage — in production use S3/Cloudinary)
  const fileName = `${Date.now()}-${file.name}`;
  const fileUrl = `/uploads/${fileName}`;

  try {
    // Write file to public/uploads (mock file storage)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const path = `public/uploads/${fileName}`;
    
    const fs = await import("fs/promises");
    await fs.mkdir("public/uploads", { recursive: true });
    await fs.writeFile(path, buffer);

    await prisma.document.create({
      data: {
        applicationId,
        type: docType as "ID_PROOF" | "INCOME_PROOF" | "BANK_STATEMENT" | "OTHER",
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
      },
    });

    revalidatePath(`/dashboard/applications/${applicationId}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to upload document:", err);
    return { success: false, error: "Failed to upload document" };
  }
}

/**
 * Admin: Review an application (approve/reject/under review)
 */
export async function reviewApplication(
  applicationId: string,
  formData: FormData
): Promise<ApplicationState> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const raw = {
    status: formData.get("status") as string,
    reviewNote: (formData.get("reviewNote") as string) || "",
    interestRate: formData.get("interestRate")
      ? Number(formData.get("interestRate"))
      : undefined,
  };

  const validated = reviewApplicationSchema.safeParse(raw);
  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { status, reviewNote, interestRate } = validated.data;

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return { error: "Application not found" };
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: status as "APPROVED" | "REJECTED" | "UNDER_REVIEW",
        reviewNote: reviewNote || null,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
        interestRate: interestRate || application.interestRate,
      },
    });

    // If approved, create loan and generate EMI schedule
    if (status === "APPROVED") {
      const rate = interestRate || application.interestRate;
      const emiResult = generateEMISchedule(
        application.amount,
        rate,
        application.tenure,
        new Date()
      );

      // Create loan record
      const loan = await prisma.loan.create({
        data: {
          applicationId,
          principal: application.amount,
          interestRate: rate,
          tenureMonths: application.tenure,
          monthlyEMI: emiResult.monthlyEMI,
          totalInterest: emiResult.totalInterest,
          totalAmount: emiResult.totalAmount,
          outstandingBalance: application.amount,
          status: "ACTIVE",
          disbursedAt: new Date(),
        },
      });

      // Create EMI schedule entries
      await prisma.eMI.createMany({
        data: emiResult.schedule.map((entry) => ({
          loanId: loan.id,
          emiNumber: entry.emiNumber,
          dueDate: entry.dueDate,
          principalComponent: entry.principalComponent,
          interestComponent: entry.interestComponent,
          amount: entry.amount,
          outstandingAfter: entry.outstandingAfter,
          status: "DUE",
        })),
      });

      // Create initial escrow entry (deposit for insurance/tax impound)
      const escrowDeposit = Math.round(application.amount * 0.005); // 0.5% of principal
      if (escrowDeposit > 0) {
        await prisma.escrowEntry.create({
          data: {
            loanId: loan.id,
            type: "DEPOSIT",
            amount: escrowDeposit,
            description: "Initial insurance & tax impound deposit",
            balanceAfter: escrowDeposit,
          },
        });

        await prisma.loan.update({
          where: { id: loan.id },
          data: { escrowBalance: escrowDeposit },
        });
      }
    }

    revalidatePath("/admin/applications");
    revalidatePath(`/admin/applications/${applicationId}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to review application:", err);
    return { error: "Failed to process review. Please try again." };
  }
}
