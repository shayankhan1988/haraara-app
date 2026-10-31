import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { SESSION_DAYS } from "./config";

const COOKIE = "gd_session";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.banned) return null;
  const { id, email, username, role, locale, banned, createdAt } = session.user;
  return { id, email, username, role, locale, banned, createdAt };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

const RANK: Record<Role, number> = { USER: 0, CURATOR: 1, MODERATOR: 2, ADMIN: 3 };

export function hasRole(user: { role: Role } | null, min: Role) {
  return !!user && RANK[user.role] >= RANK[min];
}
