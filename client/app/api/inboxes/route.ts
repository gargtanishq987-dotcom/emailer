import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getAllInboxes } from "@/lib/firestore-helpers";

export async function GET() {
  try {
    await requireSession();
    const inboxes = await getAllInboxes();
    return NextResponse.json({ success: true, data: inboxes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
