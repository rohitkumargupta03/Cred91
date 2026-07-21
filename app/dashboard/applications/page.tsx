import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { PlusCircle, FileText, ArrowRight } from "lucide-react";

export default async function ApplicationsPage() {
  const session = await requireAuth();

  const applications = await prisma.application.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      documents: { select: { id: true } },
      loan: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Applications"
        description="Track your loan application status"
      >
        <Link
          href="/dashboard/apply"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors btn-press"
        >
          <PlusCircle className="h-4 w-4" />
          New Application
        </Link>
      </PageHeader>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          description="You haven't submitted any loan applications yet"
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          action={
            <Link
              href="/dashboard/apply"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors btn-press"
            >
              <PlusCircle className="h-4 w-4" />
              Apply Now
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-border bg-card p-5 card-hover"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-card-foreground truncate">
                      {app.purpose}
                    </h3>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(app.amount)} • {app.tenure} months •{" "}
                    Applied {formatDate(app.createdAt)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>{app.documents.length} document(s)</span>
                    {app.creditScore && (
                      <span>Credit Score: {app.creditScore}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {app.loan && (
                    <Link
                      href={`/dashboard/loans/${app.loan.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View Loan <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Status timeline */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  {["PENDING", "UNDER_REVIEW", "APPROVED"].map((step, i) => {
                    const statusOrder = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
                    const currentIndex = statusOrder.indexOf(app.status);
                    const stepIndex = statusOrder.indexOf(step);
                    const isActive = app.status === "REJECTED"
                      ? step === "PENDING" || step === "UNDER_REVIEW"
                      : stepIndex <= currentIndex;
                    const isCurrent = step === app.status;

                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              isActive
                                ? "bg-emerald-500"
                                : "bg-border"
                            } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                          />
                          <span
                            className={`text-xs truncate ${
                              isActive
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.replace("_", " ")}
                          </span>
                        </div>
                        {i < 2 && (
                          <div
                            className={`flex-1 h-0.5 mx-2 rounded-full ${
                              stepIndex < currentIndex
                                ? "bg-emerald-500"
                                : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                  {app.status === "REJECTED" && (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-red-100" />
                      <span className="text-xs text-red-600 font-medium">
                        Rejected
                      </span>
                    </div>
                  )}
                </div>
                {app.reviewNote && (
                  <p className="mt-3 text-xs text-muted-foreground italic bg-muted rounded-lg px-3 py-2">
                    &ldquo;{app.reviewNote}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
