import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { Wallet } from "lucide-react";

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const loans = await prisma.loan.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        select: { user: { select: { name: true, email: true } }, purpose: true },
      },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="All Loans"
          description="Manage and track active loan accounts"
        />
        <div className="flex items-center gap-2">
          <Link
            href="/admin/loans"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/loans?status=ACTIVE"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === "ACTIVE" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </Link>
          <Link
            href="/admin/loans?status=DELINQUENT"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === "DELINQUENT" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Delinquent
          </Link>
          <Link
            href="/admin/loans?status=CLOSED"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === "CLOSED" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Closed
          </Link>
        </div>
      </div>

      {loans.length === 0 ? (
        <EmptyState
          title="No loans found"
          description={status ? `There are no loans with status ${status}.` : "No loans have been disbursed yet."}
          icon={<Wallet className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Borrower</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Principal</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Outstanding</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Disbursed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{loan.application.user.name}</p>
                      <p className="text-xs text-muted-foreground">{loan.application.purpose}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{formatCurrency(loan.principal)}</p>
                      <p className="text-xs text-muted-foreground">{loan.interestRate}% • {loan.tenureMonths}m</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="font-medium text-foreground">{formatCurrency(loan.outstandingBalance)}</p>
                      <p className="text-xs text-muted-foreground">EMI: {formatCurrency(loan.monthlyEMI)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {loan.disbursedAt ? formatDate(loan.disbursedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
