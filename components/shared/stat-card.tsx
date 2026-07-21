import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/40 glass p-5 shadow-sm card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            iconClassName || "bg-emerald-50 text-emerald-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
