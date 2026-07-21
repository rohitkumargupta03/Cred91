"use client";

import { login } from "@/app/actions/auth";
import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 mb-8 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">
          C9
        </div>
        <h1 className="text-2xl font-bold gradient-text">Cred91</h1>
      </div>

      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {state?.error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 animate-scale-in">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="w-full h-11 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
          />
          {state?.fieldErrors?.email && (
            <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full h-11 rounded-lg border border-input bg-background px-4 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {state?.fieldErrors?.password && (
            <p className="text-xs text-red-600">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press flex items-center justify-center gap-2"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-primary font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>

      {/* Demo credentials hint */}
      <div className="mt-8 rounded-lg bg-muted/50 border border-border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Demo Credentials
        </p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-medium">Admin:</span> admin@cred91.com / admin123
          </p>
          <p>
            <span className="font-medium">Borrower:</span> rahul@example.com /
            borrower123
          </p>
        </div>
      </div>
    </div>
  );
}
