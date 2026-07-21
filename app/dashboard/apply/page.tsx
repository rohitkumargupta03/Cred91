"use client";

import { submitApplication } from "@/app/actions/applications";
import { useActionState, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  User,
  Briefcase,
  IndianRupee,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
} from "lucide-react";

const steps = [
  { title: "Personal Info", icon: User },
  { title: "Employment", icon: Briefcase },
  { title: "Loan Details", icon: IndianRupee },
];

const purposeOptions = [
  "Home Purchase",
  "Home Renovation",
  "Education",
  "Vehicle Purchase",
  "Business Expansion",
  "Medical Emergency",
  "Debt Consolidation",
  "Personal",
  "Other",
];

const tenureOptions = [3, 6, 12, 24, 36, 48, 60, 84, 120, 180, 240];

export default function ApplyPage() {
  const [state, action, pending] = useActionState(submitApplication, null);
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Apply for a Loan"
        description="Fill in your details to submit a loan application"
      />

      {/* Step Indicator */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all ${
                    index < currentStep
                      ? "bg-emerald-500 text-white"
                      : index === currentStep
                      ? "bg-primary text-primary-foreground ring-4 ring-emerald-100"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block truncate ${
                    index <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 rounded-full transition-colors ${
                    index < currentStep ? "bg-emerald-500" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {state?.error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 animate-scale-in">
          {state.error}
        </div>
      )}

      <form action={action}>
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {/* Step 1: Personal Info */}
          <div className={currentStep === 0 ? "block" : "hidden"}>
            <h3 className="text-lg font-semibold mb-6">Personal Information</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
                {state?.fieldErrors?.fullName && (
                  <p className="text-xs text-red-600">{state.fieldErrors.fullName[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  {state?.fieldErrors?.dateOfBirth && (
                    <p className="text-xs text-red-600">{state.fieldErrors.dateOfBirth[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="9876543210"
                    className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  {state?.fieldErrors?.phone && (
                    <p className="text-xs text-red-600">{state.fieldErrors.phone[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Residential Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  placeholder="Enter your complete address"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
                />
                {state?.fieldErrors?.address && (
                  <p className="text-xs text-red-600">{state.fieldErrors.address[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Employment */}
          <div className={currentStep === 1 ? "block" : "hidden"}>
            <h3 className="text-lg font-semibold mb-6">Employment & Income</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="employmentType" className="text-sm font-medium">
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  name="employmentType"
                  required
                  defaultValue=""
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="SALARIED">Salaried</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="BUSINESS">Business Owner</option>
                </select>
                {state?.fieldErrors?.employmentType && (
                  <p className="text-xs text-red-600">{state.fieldErrors.employmentType[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="employer" className="text-sm font-medium">
                  Employer / Business Name{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="employer"
                  name="employer"
                  type="text"
                  placeholder="Company name"
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="monthlyIncome" className="text-sm font-medium">
                    Monthly Income (₹)
                  </label>
                  <input
                    id="monthlyIncome"
                    name="monthlyIncome"
                    type="number"
                    required
                    min={10000}
                    placeholder="50000"
                    className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  {state?.fieldErrors?.monthlyIncome && (
                    <p className="text-xs text-red-600">{state.fieldErrors.monthlyIncome[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="yearsEmployed" className="text-sm font-medium">
                    Years of Experience
                  </label>
                  <input
                    id="yearsEmployed"
                    name="yearsEmployed"
                    type="number"
                    required
                    min={0}
                    step={0.5}
                    placeholder="5"
                    className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  {state?.fieldErrors?.yearsEmployed && (
                    <p className="text-xs text-red-600">{state.fieldErrors.yearsEmployed[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Loan Details */}
          <div className={currentStep === 2 ? "block" : "hidden"}>
            <h3 className="text-lg font-semibold mb-6">Loan Details</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Loan Amount (₹)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  required
                  min={50000}
                  max={50000000}
                  step={10000}
                  placeholder="500000"
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
                <p className="text-xs text-muted-foreground">Min ₹50,000 — Max ₹5,00,00,000</p>
                {state?.fieldErrors?.amount && (
                  <p className="text-xs text-red-600">{state.fieldErrors.amount[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="tenure" className="text-sm font-medium">
                  Loan Tenure (months)
                </label>
                <select
                  id="tenure"
                  name="tenure"
                  required
                  defaultValue=""
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                >
                  <option value="" disabled>
                    Select tenure
                  </option>
                  {tenureOptions.map((t) => (
                    <option key={t} value={t}>
                      {t} months ({(t / 12).toFixed(1)} years)
                    </option>
                  ))}
                </select>
                {state?.fieldErrors?.tenure && (
                  <p className="text-xs text-red-600">{state.fieldErrors.tenure[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="purpose" className="text-sm font-medium">
                  Loan Purpose
                </label>
                <select
                  id="purpose"
                  name="purpose"
                  required
                  defaultValue=""
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                >
                  <option value="" disabled>
                    Select purpose
                  </option>
                  {purposeOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {state?.fieldErrors?.purpose && (
                  <p className="text-xs text-red-600">{state.fieldErrors.purpose[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors btn-press"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors btn-press"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-press"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
