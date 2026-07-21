import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { UpdateNotesForm } from "./update-notes-form";
import { AlertTriangle } from "lucide-react";

export default async function DelinquentLoansPage() {
  await requireAdmin();

  const loans = await prisma.loan.findMany({
    where: { status: "DELINQUENT" },
    orderBy: { updatedAt: "desc" },
    include: {
      application: {
        select: { user: { select: { name: true, phone: true, email: true } } },
      },
      emis: {
        where: { status: "OVERDUE" },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Delinquent Accounts"
        description="Manage loans with 3 or more consecutive overdue EMIs"
      />

      {loans.length === 0 ? (
        <EmptyState
          title="No delinquent accounts"
          description="Great! All active loans are currently in good standing."
          icon={<AlertTriangle className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const overdueAmount = loan.emis.reduce((sum, e) => sum + e.amount, 0);
            
            return (
              <div key={loan.id} className="rounded-xl border border-red-200 bg-card overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-red-900">{loan.application.user.name}</h3>
                      <StatusBadge status={loan.status} size="sm" />
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {loan.application.user.email} • {loan.application.user.phone || "No phone"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-red-700 font-medium">Total Overdue</p>
                    <p className="text-xl font-bold text-red-900">{formatCurrency(overdueAmount)}</p>
                    <p className="text-xs text-red-600">{loan.emis.length} EMIs behind</p>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Overdue Schedule */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Overdue EMIs</h4>
                    <div className="space-y-2">
                      {loan.emis.slice(0, 3).map((emi) => (
                        <div key={emi.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm border border-border">
                          <span>EMI #{emi.emiNumber} (Due {formatDate(emi.dueDate)})</span>
                          <span className="font-medium text-red-600">{formatCurrency(emi.amount)}</span>
                        </div>
                      ))}
                      {loan.emis.length > 3 && (
                        <p className="text-xs text-muted-foreground italic text-center">
                          + {loan.emis.length - 3} more overdue EMIs
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Follow-up Notes */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Collection Notes</h4>
                    <UpdateNotesForm loanId={loan.id} initialNotes={loan.delinquentNotes || ""} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
