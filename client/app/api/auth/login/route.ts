import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.isLoggedIn = true;
  session.email = "admin";
  await session.save();
  return NextResponse.json({ success: true, data: { email: "admin" } });
}
