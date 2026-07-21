import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReviewForm } from "./review-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Briefcase, IndianRupee, FileText } from "lucide-react";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      documents: true,
      loan: { select: { id: true } },
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/applications"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title={`Application: ${application.user.name}`}
          description={`Submitted on ${formatDate(application.createdAt)}`}
        >
          <StatusBadge status={application.status} size="lg" />
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applicant Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Credit Score Banner */}
          <div className="rounded-xl border border-border bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">System Credit Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{application.creditScore || "N/A"}</span>
                <span className="text-sm text-slate-400">/ 850</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm font-medium mb-1">Suggested Interest Rate</p>
              <span className="text-2xl font-bold text-emerald-400">{application.interestRate}% p.a.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
                <User className="h-4 w-4 text-primary" />
                Personal Details
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="font-medium">{application.fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email Address</p>
                  <p className="font-medium">{application.user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{application.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(application.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{application.address}</p>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
                <Briefcase className="h-4 w-4 text-primary" />
                Employment Details
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Employment Type</p>
                  <p className="font-medium">{application.employmentType.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employer</p>
                  <p className="font-medium">{application.employer || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Income</p>
                  <p className="font-medium">{formatCurrency(application.monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Years Employed</p>
                  <p className="font-medium">{application.yearsEmployed} years</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Request */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
              <IndianRupee className="h-4 w-4 text-primary" />
              Loan Request
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Requested Amount</p>
                <p className="font-medium text-lg">{formatCurrency(application.amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tenure</p>
                <p className="font-medium text-lg">{application.tenure} months</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-muted-foreground">Purpose</p>
                <p className="font-medium">{application.purpose}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Uploaded Documents
            </div>
            {application.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {application.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                      View File
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Review Action */}
        <div className="space-y-6">
          <ReviewForm application={application} />
          
          {application.loan && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-semibold text-emerald-800 mb-2">Loan Created</h3>
              <p className="text-sm text-emerald-600 mb-4">
                This application was approved and a loan account has been created.
              </p>
              <Link
                href={`/admin/loans`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors btn-press"
              >
                View Loan Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
