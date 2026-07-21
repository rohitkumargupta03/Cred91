"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  // Application statuses
  PENDING: { label: "Pending", className: "badge-pending" },
  UNDER_REVIEW: { label: "Under Review", className: "badge-under-review" },
  APPROVED: { label: "Approved", className: "badge-approved" },
  REJECTED: { label: "Rejected", className: "badge-rejected" },
  // Loan statuses
  ACTIVE: { label: "Active", className: "badge-active" },
  CLOSED: { label: "Closed", className: "badge-closed" },
  DELINQUENT: { label: "Delinquent", className: "badge-delinquent" },
  // EMI statuses
  DUE: { label: "Due", className: "badge-due" },
  PAID: { label: "Paid", className: "badge-paid" },
  OVERDUE: { label: "Overdue", className: "badge-overdue" },
};

const sizeClasses = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700 border border-gray-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full whitespace-nowrap",
        sizeClasses[size],
        config.className,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full mr-1.5", {
          "bg-amber-500": status === "PENDING" || status === "DUE",
          "bg-blue-500": status === "UNDER_REVIEW",
          "bg-emerald-500": status === "APPROVED" || status === "ACTIVE" || status === "PAID",
          "bg-red-500": status === "REJECTED" || status === "DELINQUENT" || status === "OVERDUE",
          "bg-slate-400": status === "CLOSED",
        })}
      />
      {config.label}
    </span>
  );
}
