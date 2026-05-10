import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getGmailCredentials, saveGmailCredentials } from "@/lib/firestore-helpers";

export async function GET() {
  try {
    await requireSession();
    const creds = await getGmailCredentials();
    return NextResponse.json({ success: true, data: creds });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json().catch(() => null);
    if (!body?.googleClientId || !body?.googleRedirectUri) {
      return NextResponse.json({ success: false, error: "Client ID and Redirect URI required" }, { status: 400 });
    }
    await saveGmailCredentials(body);
    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
