import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/gmail-client";
import { getSession } from "@/lib/session";
import { createInbox, getAllInboxes } from "@/lib/firestore-helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/inboxes?error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/inboxes?error=missing_params", req.url));
  }

  const session = await getSession();
  if (!session.isLoggedIn || session.gmailOAuthState !== state) {
    return NextResponse.redirect(new URL("/inboxes?error=invalid_state", req.url));
  }

  session.gmailOAuthState = undefined;
  await session.save();

  try {
    const tokens = await exchangeCodeForTokens(code);

    const existing = await getAllInboxes();
    const alreadyConnected = existing.some((i) => i.email === tokens.email);
    if (alreadyConnected) {
      return NextResponse.redirect(new URL("/inboxes?error=already_connected", req.url));
    }

    await createInbox({
      email: tokens.email,
      displayName: tokens.displayName,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      tokenExpiry: tokens.tokenExpiry,
      dailyLimit: 30,
      sentToday: 0,
      lastResetDate: "",
      timezone: "America/New_York",
      sendingWindowStart: "09:00",
      sendingWindowEnd: "17:00",
      status: "active",
      health: "good",
    });

    return NextResponse.redirect(new URL("/inboxes?connected=1", req.url));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/inboxes?error=${encodeURIComponent(msg)}`, req.url)
    );
  }
}
