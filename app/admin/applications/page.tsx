import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { FileText } from "lucide-react";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const applications = await prisma.application.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Loan Applications"
          description="Review and manage all loan applications"
        />
        <div className="flex items-center gap-2">
          <Link
            href="/admin/applications"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/applications?status=PENDING"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === "PENDING" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending
          </Link>
          <Link
            href="/admin/applications?status=UNDER_REVIEW"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === "UNDER_REVIEW" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Reviewing
          </Link>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          description={status ? `There are no applications with status ${status}.` : "No loan applications have been submitted yet."}
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Applicant</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Amount & Purpose</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Credit Score</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Applied On</th>
                  <th className="text-center font-medium text-muted-foreground px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{app.user.name}</p>
                      <p className="text-xs text-muted-foreground">{app.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{formatCurrency(app.amount)}</p>
                      <p className="text-xs text-muted-foreground">{app.purpose}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`font-semibold ${
                        !app.creditScore ? "text-muted-foreground" :
                        app.creditScore >= 750 ? "text-emerald-600" :
                        app.creditScore >= 650 ? "text-blue-600" :
                        app.creditScore >= 550 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {app.creditScore || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors"
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
  );
}
