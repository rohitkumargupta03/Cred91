import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PayEMIButton } from "./pay-emi-button";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  IndianRupee,
  Calendar,
  Percent,
  CreditCard,
  ArrowLeft,
  Landmark,
} from "lucide-react";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      application: {
        select: { userId: true, purpose: true, fullName: true },
      },
      emis: { orderBy: { emiNumber: "asc" } },
      transactions: {
        orderBy: { paidAt: "desc" },
        include: { emi: { select: { emiNumber: true } } },
      },
    },
  });

  if (!loan || (loan.application.userId !== session.userId && session.role !== "ADMIN")) {
    notFound();
  }

  const paidEMIs = loan.emis.filter((e) => e.status === "PAID").length;
  const overdueEMIs = loan.emis.filter((e) => e.status === "OVERDUE").length;
  const totalPaid = loan.transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/loans"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title={loan.application.purpose}
          description={`Loan #${loan.id.slice(-8).toUpperCase()}`}
        >
          <StatusBadge status={loan.status} size="lg" />
        </PageHeader>
      </div>

      {/* Loan Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Principal"
          value={formatCurrency(loan.principal)}
          subtitle={`${loan.tenureMonths} months tenure`}
          icon={IndianRupee}
        />
        <StatCard
          title="Monthly EMI"
          value={formatCurrency(loan.monthlyEMI)}
          subtitle={`${loan.interestRate}% p.a.`}
          icon={Calendar}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(loan.outstandingBalance)}
          subtitle={`${paidEMIs}/${loan.emis.length} EMIs paid`}
          icon={CreditCard}
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          subtitle={`Total interest: ${formatCurrency(loan.totalInterest)}`}
          icon={Percent}
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Escrow link */}
      <Link
        href={`/dashboard/loans/${loan.id}/escrow`}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-hover"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Escrow Account</p>
          <p className="text-sm text-muted-foreground">
            Balance: {formatCurrency(loan.escrowBalance)}
          </p>
        </div>
        <span className="text-sm text-primary">View Ledger →</span>
      </Link>

      {/* EMI Schedule */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Repayment Schedule</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">
                    #
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">
                    Due Date
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                    Principal
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                    Interest
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">
                    EMI
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                    Balance
                  </th>
                  <th className="text-center font-medium text-muted-foreground px-4 py-3">
                    Status
                  </th>
                  <th className="text-center font-medium text-muted-foreground px-4 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loan.emis.map((emi) => (
                  <tr
                    key={emi.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{emi.emiNumber}</td>
                    <td className="px-4 py-3">{formatDate(emi.dueDate)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {formatCurrency(emi.principalComponent)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {formatCurrency(emi.interestComponent)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(emi.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                      {formatCurrency(emi.outstandingAfter)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={emi.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(emi.status === "DUE" || emi.status === "OVERDUE") && (
                        <PayEMIButton
                          loanId={loan.id}
                          emiId={emi.id}
                          amount={emi.amount}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {loan.transactions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Payment History</h2>
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
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                      Reference
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Paid On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loan.transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        #{txn.emi?.emiNumber || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-600">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {txn.method}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono hidden sm:table-cell">
                        {txn.reference || "—"}
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
