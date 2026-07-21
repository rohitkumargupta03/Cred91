import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkOverdueAndDelinquency } from "@/lib/overdue-check";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import {
  CreditCard,
  IndianRupee,
  Calendar,
  CheckCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

export default async function BorrowerDashboard() {
  const session = await requireAuth();

  // Run overdue check on page load
  await checkOverdueAndDelinquency();

  // Fetch borrower's data
  const [applications, loans, transactions] = await Promise.all([
    prisma.application.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.loan.findMany({
      where: { application: { userId: session.userId } },
      include: {
        emis: { orderBy: { emiNumber: "asc" } },
        application: { select: { fullName: true, purpose: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { loan: { application: { userId: session.userId } } },
      orderBy: { paidAt: "desc" },
      take: 5,
      include: {
        emi: { select: { emiNumber: true } },
        loan: { select: { id: true } },
      },
    }),
  ]);

  // Calculate summary stats
  const activeLoans = loans.filter((l) => l.status === "ACTIVE" || l.status === "DELINQUENT");
  const totalOutstanding = activeLoans.reduce(
    (sum, l) => sum + l.outstandingBalance,
    0
  );
  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Next EMI due
  const allDueEMIs = activeLoans
    .flatMap((l) =>
      l.emis
        .filter((e) => e.status === "DUE" || e.status === "OVERDUE")
        .map((e) => ({ ...e, loanId: l.id }))
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const nextEMI = allDueEMIs[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${session.name.split(" ")[0]}!`}
        description="Here's an overview of your loan portfolio"
      >
        <Link
          href="/dashboard/apply"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors btn-press"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Apply for Loan</span>
          <span className="sm:hidden">Apply</span>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Loans"
          value={activeLoans.length}
          subtitle={`${loans.length} total loans`}
          icon={CreditCard}
        />
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle="Principal remaining"
          icon={IndianRupee}
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Next EMI Due"
          value={nextEMI ? formatCurrency(nextEMI.amount) : "—"}
          subtitle={nextEMI ? formatDate(nextEMI.dueDate) : "No EMIs due"}
          icon={Calendar}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          subtitle={`${transactions.length} payments`}
          icon={CheckCircle}
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Active Loans */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Loans</h2>
          {activeLoans.length > 0 && (
            <Link
              href="/dashboard/loans"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {activeLoans.length === 0 ? (
          <EmptyState
            title="No active loans"
            description="Apply for a loan to get started with your financial journey"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoans.map((loan) => {
              const paidEMIs = loan.emis.filter((e) => e.status === "PAID").length;
              const progress = Math.round((paidEMIs / loan.emis.length) * 100);
              return (
                <Link
                  key={loan.id}
                  href={`/dashboard/loans/${loan.id}`}
                  className="block rounded-xl border border-border bg-card p-5 card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-card-foreground">
                        {loan.application.purpose}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatCurrency(loan.principal)} at {loan.interestRate}% p.a.
                      </p>
                    </div>
                    <StatusBadge status={loan.status} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Repayment Progress</span>
                      <span className="font-medium">{paidEMIs}/{loan.emis.length} EMIs</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Outstanding: {formatCurrency(loan.outstandingBalance)}</span>
                      <span>EMI: {formatCurrency(loan.monthlyEMI)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Applications</h2>
          {applications.length > 0 && (
            <Link
              href="/dashboard/applications"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Submit your first loan application to get started"
          />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Purpose
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                      Amount
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Status
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                      Applied On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{app.purpose}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {formatCurrency(app.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {formatDate(app.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      {transactions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Payments</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      EMI #
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Amount
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                      Method
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Paid On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        #{txn.emi?.emiNumber || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-600">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {txn.method}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(txn.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
