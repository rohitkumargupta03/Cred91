import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";

export default async function LoansPage() {
  const session = await requireAuth();

  const loans = await prisma.loan.findMany({
    where: { application: { userId: session.userId } },
    orderBy: { createdAt: "desc" },
    include: {
      application: { select: { purpose: true, fullName: true } },
      emis: { orderBy: { emiNumber: "asc" } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Loans"
        description="View and manage your active loans"
      />

      {loans.length === 0 ? (
        <EmptyState
          title="No loans yet"
          description="Once your loan application is approved, it will appear here"
          icon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const paidEMIs = loan.emis.filter((e) => e.status === "PAID").length;
            const overdueEMIs = loan.emis.filter((e) => e.status === "OVERDUE").length;
            const progress = Math.round((paidEMIs / loan.emis.length) * 100);

            return (
              <Link
                key={loan.id}
                href={`/dashboard/loans/${loan.id}`}
                className="block rounded-xl border border-border bg-card p-5 card-hover"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{loan.application.purpose}</h3>
                      <StatusBadge status={loan.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(loan.principal)} at {loan.interestRate}% •{" "}
                      {loan.tenureMonths} months
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    View Details <ArrowRight className="h-3 w-3" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly EMI</p>
                    <p className="font-semibold">{formatCurrency(loan.monthlyEMI)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="font-semibold">{formatCurrency(loan.outstandingBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EMIs Paid</p>
                    <p className="font-semibold">{paidEMIs}/{loan.emis.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                    <p className={`font-semibold ${overdueEMIs > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {overdueEMIs}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{progress}% repaid</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
