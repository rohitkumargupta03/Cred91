"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { signupSchema, loginSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/**
 * Sign up a new borrower user
 */
export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    phone: (formData.get("phone") as string) || undefined,
  };

  const validated = signupSchema.safeParse(raw);
  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, phone } = validated.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "BORROWER",
    },
  });

  // Create session and redirect
  await createSession({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}

/**
 * Log in an existing user
 */
export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = loginSchema.safeParse(raw);
  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = validated.data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Invalid email or password" };
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { error: "Invalid email or password" };
  }

  // Create session
  await createSession({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  // Role-based redirect
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

/**
 * Log out the current user
 */
export async function logout() {
  await deleteSession();
  redirect("/auth/login");
}
