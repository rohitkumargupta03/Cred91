import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cred91 - Login",
  description: "Log in to your Cred91 account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white font-bold text-xl backdrop-blur-sm">
              C9
            </div>
            <h1 className="text-3xl font-bold text-white">Cred91</h1>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Your Loan Journey,
            <br />
            <span className="text-emerald-200">Simplified.</span>
          </h2>
          <p className="text-lg text-emerald-100/80 max-w-md leading-relaxed">
            Apply for loans, track applications, manage repayments — all in one
            seamless platform. Fast approvals, transparent terms.
          </p>
          <div className="mt-10 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-white">₹50Cr+</p>
              <p className="text-sm text-emerald-200/70 mt-1">Loans Disbursed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">2,500+</p>
              <p className="text-sm text-emerald-200/70 mt-1">Happy Borrowers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99.2%</p>
              <p className="text-sm text-emerald-200/70 mt-1">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        {children}
      </div>
    </div>
  );
}
