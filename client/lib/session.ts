import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionData } from "@/lib/types";

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: "cep_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function requireSession(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw new Error("Unauthorized");
  }
  return session;
}
