/**
 * Zod validation schemas for Cred91 LMS
 * Used for both client-side and server-side validation
 */
import { z } from "zod";

// ─── Auth Schemas ───────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be less than 15 digits")
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required"),
});

// ─── Application Schemas ────────────────────────────────────────────

export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .trim(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required"),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters")
    .trim(),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be less than 15 digits"),
});

export const employmentInfoSchema = z.object({
  employmentType: z.enum(["SALARIED", "SELF_EMPLOYED", "BUSINESS"], {
    required_error: "Please select employment type",
  }),
  employer: z
    .string()
    .max(200, "Employer name must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  monthlyIncome: z
    .number({ required_error: "Monthly income is required" })
    .min(10000, "Minimum income must be ₹10,000")
    .max(100000000, "Income seems too high"),
  yearsEmployed: z
    .number({ required_error: "Years of experience is required" })
    .min(0, "Years employed cannot be negative")
    .max(50, "Years employed seems too high"),
});

export const loanDetailsSchema = z.object({
  amount: z
    .number({ required_error: "Loan amount is required" })
    .min(50000, "Minimum loan amount is ₹50,000")
    .max(50000000, "Maximum loan amount is ₹5,00,00,000"),
  tenure: z
    .number({ required_error: "Tenure is required" })
    .min(3, "Minimum tenure is 3 months")
    .max(360, "Maximum tenure is 360 months"),
  purpose: z
    .string()
    .min(3, "Purpose must be at least 3 characters")
    .max(200, "Purpose must be less than 200 characters")
    .trim(),
});

// Combined application schema
export const applicationSchema = personalInfoSchema
  .merge(employmentInfoSchema)
  .merge(loanDetailsSchema);

// ─── Admin Review Schema ────────────────────────────────────────────

export const reviewApplicationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "UNDER_REVIEW"]),
  reviewNote: z
    .string()
    .min(3, "Review note must be at least 3 characters")
    .max(1000, "Review note must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  interestRate: z
    .number()
    .min(1, "Interest rate must be at least 1%")
    .max(36, "Interest rate must be less than 36%")
    .optional(),
});

// ─── Payment Schema ─────────────────────────────────────────────────

export const paymentSchema = z.object({
  emiId: z.string().min(1, "EMI ID is required"),
  method: z.enum(["ONLINE", "BANK_TRANSFER", "CASH", "UPI"]).default("ONLINE"),
});

// ─── Escrow Schema ──────────────────────────────────────────────────

export const escrowEntrySchema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
  amount: z
    .number({ required_error: "Amount is required" })
    .min(1, "Amount must be at least ₹1"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

// ─── Delinquency Notes Schema ───────────────────────────────────────

export const delinquencyNotesSchema = z.object({
  notes: z
    .string()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
});

// ─── Types ──────────────────────────────────────────────────────────

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type EmploymentInfoInput = z.infer<typeof employmentInfoSchema>;
export type LoanDetailsInput = z.infer<typeof loanDetailsSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type EscrowEntryInput = z.infer<typeof escrowEntrySchema>;
