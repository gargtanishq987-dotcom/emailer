import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getAllCampaigns, createCampaign } from "@/lib/firestore-helpers";
import { CampaignSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession();
    const campaigns = await getAllCampaigns();
    return NextResponse.json({ success: true, data: campaigns });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json().catch(() => null);
    const parsed = CampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const id = await createCampaign({
      ...parsed.data,
      status: "draft",
      totalLeads: 0,
      sentCount: 0,
      replyCount: 0,
      positiveCount: 0,
      bookedCount: 0,
    });

    return NextResponse.json({ success: true, data: { id } }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
