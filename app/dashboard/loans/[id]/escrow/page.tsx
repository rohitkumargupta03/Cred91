import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Landmark, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default async function EscrowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      application: { select: { userId: true, purpose: true } },
      escrowEntries: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!loan || (loan.application.userId !== session.userId && session.role !== "ADMIN")) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/loans/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title="Escrow Account"
          description={`${loan.application.purpose} — Loan #${loan.id.slice(-8).toUpperCase()}`}
        />
      </div>

      {/* Balance Card */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-teal-50 to-emerald-50 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Landmark className="h-6 w-6 text-teal-600" />
          <span className="text-sm font-medium text-teal-700">Current Balance</span>
        </div>
        <p className="text-3xl font-bold text-teal-800">
          {formatCurrency(loan.escrowBalance)}
        </p>
        <p className="text-sm text-teal-600 mt-1">
          {loan.escrowEntries.length} transaction(s) on record
        </p>
      </div>

      {/* Escrow Ledger */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Transaction Ledger</h2>

        {loan.escrowEntries.length === 0 ? (
          <EmptyState
            title="No escrow entries"
            description="Escrow deposits and withdrawals will appear here"
            icon={<Landmark className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Type</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Amount</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Description</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Balance After</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loan.escrowEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.type === "DEPOSIT" ? (
                            <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {entry.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                          </span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        entry.type === "DEPOSIT" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {entry.type === "DEPOSIT" ? "+" : "-"}{formatCurrency(entry.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {entry.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(entry.balanceAfter)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
