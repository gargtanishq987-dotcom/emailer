import { NextResponse } from "next/server";
import crypto from "crypto";
import { getGmailAuthUrl } from "@/lib/gmail-client";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  session.gmailOAuthState = state;
  await session.save();

  const authUrl = await getGmailAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
