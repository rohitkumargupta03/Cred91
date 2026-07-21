import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-16 glass-header z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
              C9
            </div>
            <span className="font-bold text-xl tracking-tight">Cred91</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors btn-press"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
            Now approving loans up to ₹5,00,00,000
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
            The modern way to <br className="hidden sm:block" />
            <span className="gradient-text">finance your dreams</span>
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "200ms" }}>
            Cred91 is a next-generation Loan Origination and Management System. 
            Apply in minutes, get instant decisions, and manage your repayments seamlessly.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-8 py-3.5 text-sm font-medium hover:bg-primary-hover transition-colors btn-press shadow-lg shadow-emerald-500/20"
            >
              Apply Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-8 py-3.5 text-sm font-medium hover:bg-muted transition-colors btn-press border border-border"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="rounded-2xl glass p-8 card-hover relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-6 relative z-10">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Decisions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our proprietary credit scoring engine evaluates your profile in milliseconds, providing fair and fast loan decisions.
              </p>
            </div>
            
            <div className="rounded-2xl glass p-8 card-hover relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-6 relative z-10">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Escrow</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built-in escrow management ensures your insurance and tax impounds are handled safely and transparently.
              </p>
            </div>
            
            <div className="rounded-2xl glass p-8 card-hover relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-6 relative z-10">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Flexible Repayments</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track your EMI schedule, make payments online, and monitor your outstanding balance all from one clean dashboard.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white/50 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-white font-bold text-[10px]">
              C9
            </div>
            <span className="font-semibold text-sm">Cred91</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Cred91 Financial Services. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
