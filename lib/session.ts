/**
 * Session management for Cred91 LMS
 * Uses jose for JWT encryption/decryption (Edge-compatible)
 * Stores session in HTTP-only cookies
 */
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const secretKey = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error("NEXTAUTH_SECRET or JWT_SECRET environment variable is required");
}
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  role: "BORROWER" | "ADMIN";
  name: string;
  email: string;
  expiresAt: Date;
}

/**
 * Encrypt session data into a JWT
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

/**
 * Decrypt and verify a JWT session token
 */
export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Create a new session and set the cookie
 */
export async function createSession(user: {
  id: string;
  role: "BORROWER" | "ADMIN";
  name: string;
  email: string;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  return decrypt(session);
}

/**
 * Require authentication — redirects to login if not authenticated
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}

/**
 * Require admin role — redirects if not admin
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}

/**
 * Require borrower role — redirects if not borrower
 */
export async function requireBorrower(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "BORROWER") {
    redirect("/admin");
  }
  return session;
}

/**
 * Delete the session cookie (logout)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

/**
 * Get full user data from DB using session
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
    },
  });

  return user;
}
