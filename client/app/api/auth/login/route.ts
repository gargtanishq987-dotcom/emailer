import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { LoginSchema } from "@/lib/validations";
import { loginRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!loginRateLimit(ip)) {
    return NextResponse.json({ success: false, error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 500 });
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.email = email;
  await session.save();

  return NextResponse.json({ success: true, data: { email } });
}
