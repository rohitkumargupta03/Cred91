import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkOverdueAndDelinquency } from "@/lib/overdue-check";
import { formatCurrency, percentage } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import {
  FileText,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function AdminDashboard() {
  await requireAdmin();

  // Run overdue check on dashboard load to keep statuses fresh
  await checkOverdueAndDelinquency();

  // Fetch all necessary data
  const [
    totalApps,
    approvedApps,
    pendingApps,
    activeLoans,
    delinquentLoans,
    totalTransactions,
    recentApplications,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: "APPROVED" } }),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.loan.findMany({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "DELINQUENT" } }),
    prisma.transaction.aggregate({ _sum: { amount: true } }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const approvalRate = percentage(approvedApps, totalApps);
  const totalDisbursed = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalCollections = totalTransactions._sum.amount || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your entire loan portfolio"
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(totalDisbursed)}
          subtitle={`${activeLoans.length} active loans`}
          icon={IndianRupee}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Collections"
          value={formatCurrency(totalCollections)}
          subtitle="All-time payments received"
          icon={TrendingUp}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Pending Applications"
          value={pendingApps}
          subtitle={`Approval Rate: ${approvalRate}%`}
          icon={FileText}
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Delinquent Accounts"
          value={delinquentLoans}
          subtitle="Loans with 3+ overdue EMIs"
          icon={AlertTriangle}
          iconClassName="bg-red-50 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Applications</h2>
            <Link
              href="/admin/applications"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <EmptyState
              title="No applications"
              description="No loan applications have been submitted yet"
            />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">
                        Applicant
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">
                        Amount
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">
                        Score
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">
                        Status
                      </th>
                      <th className="text-center font-medium text-muted-foreground px-4 py-3">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {app.user.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatCurrency(app.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${
                            !app.creditScore ? "text-muted-foreground" :
                            app.creditScore >= 750 ? "text-emerald-600" :
                            app.creditScore >= 650 ? "text-blue-600" :
                            app.creditScore >= 550 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {app.creditScore || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="text-primary hover:underline font-medium text-xs"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions / System Health */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <Link
              href="/admin/applications?status=PENDING"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Review Pending</p>
                <p className="text-xs text-muted-foreground">{pendingApps} applications waiting</p>
              </div>
            </Link>
            <Link
              href="/admin/delinquent"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Manage Delinquency</p>
                <p className="text-xs text-muted-foreground">{delinquentLoans} accounts need attention</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
