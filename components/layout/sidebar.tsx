"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Wallet,
  Shield,
  Users,
  AlertTriangle,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const borrowerNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Apply for Loan", href: "/dashboard/apply", icon: PlusCircle },
  { title: "My Applications", href: "/dashboard/applications", icon: FileText },
  { title: "My Loans", href: "/dashboard/loans", icon: CreditCard },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Applications", href: "/admin/applications", icon: FileText },
  { title: "Loans", href: "/admin/loans", icon: Wallet },
  { title: "Delinquent", href: "/admin/delinquent", icon: AlertTriangle },
];

interface SidebarProps {
  role: "BORROWER" | "ADMIN";
  userName: string;
  userEmail: string;
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = role === "ADMIN" ? adminNav : borrowerNav;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-sm">
          C9
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-white tracking-tight truncate">
            Cred91
          </h1>
          <p className="text-[11px] text-sidebar-muted truncate">
            {role === "ADMIN" ? "Admin Panel" : "Loan Portal"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-emerald-400")} />
              <span className="truncate">{item.title}</span>
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-sidebar-muted truncate">{userEmail}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-white transition-colors btn-press"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-bg text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 sidebar-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-sidebar-bg flex flex-col animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-sidebar-muted hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 glass-dark text-sidebar-foreground z-40 shadow-2xl shadow-emerald-900/10">
        {sidebarContent}
      </aside>
    </>
  );
}
