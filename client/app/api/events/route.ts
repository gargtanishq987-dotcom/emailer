import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getRecentEvents, getEventsByLead, getAllLeads, getAllCampaigns, getAllInboxes } from "@/lib/firestore-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = req.nextUrl;
    const leadId = searchParams.get("leadId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const enrich = searchParams.get("enrich") === "1";

    const events = leadId
      ? await getEventsByLead(leadId)
      : await getRecentEvents(limit);

    if (!enrich) {
      return NextResponse.json({ success: true, data: events });
    }

    // Enrich with lead email + campaign name for the logs view
    const [leads, campaigns, inboxes] = await Promise.all([
      getAllLeads({ limit: 500 }),
      getAllCampaigns(),
      getAllInboxes(),
    ]);

    const leadMap = Object.fromEntries(leads.map((l) => [l.id, l]));
    const campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c]));
    const inboxMap = Object.fromEntries(inboxes.map((i) => [i.id, i]));

    const enriched = events.map((ev) => ({
      ...ev,
      leadEmail: ev.leadId ? leadMap[ev.leadId]?.email ?? null : null,
      leadName: ev.leadId ? `${leadMap[ev.leadId]?.firstName ?? ""} ${leadMap[ev.leadId]?.lastName ?? ""}`.trim() || null : null,
      campaignName: ev.campaignId ? campaignMap[ev.campaignId]?.name ?? null : null,
      inboxEmail: ev.inboxId ? inboxMap[ev.inboxId]?.email ?? null : null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
