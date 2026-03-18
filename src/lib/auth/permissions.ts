import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { NextResponse } from "next/server";

export type Role = "ADMIN" | "BUYER" | "STUDENT" | "PROFESSIONAL";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user as { id: string; email: string; name: string; role: Role };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autorizado");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("No tienes permisos para realizar esta acción");
  }
  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "No autorizado" },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "No tienes permisos para realizar esta acción" },
    { status: 403 }
  );
}
