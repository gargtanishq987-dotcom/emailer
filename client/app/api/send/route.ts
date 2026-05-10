import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { sendEmail } from "@/lib/gmail-client";
import { getInboxById } from "@/lib/firestore-helpers";
import { TestSendSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json().catch(() => null);
    const parsed = TestSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const inbox = await getInboxById(parsed.data.inboxId);
    if (!inbox) return NextResponse.json({ success: false, error: "Inbox not found" }, { status: 404 });
    if (inbox.status !== "active") {
      return NextResponse.json({ success: false, error: "Inbox is not active" }, { status: 400 });
    }

    const result = await sendEmail({
      inboxId: inbox.id,
      to: parsed.data.to,
      subject: parsed.data.subject,
      body: parsed.data.body,
      fromEmail: inbox.email,
      fromName: inbox.displayName,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
