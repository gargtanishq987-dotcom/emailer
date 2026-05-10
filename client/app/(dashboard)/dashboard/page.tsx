"use client";

import { useQuery } from "@tanstack/react-query";
import { Send, Users, ThumbsUp, Calendar, TrendingUp, Activity, Clock, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative, formatPercent } from "@/lib/utils";
import type { AnalyticsSummary, LeadEvent } from "@/lib/types";

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const EVENT_LABELS: Record<string, string> = {
  EMAIL_SENT: "Email sent",
  FOLLOWUP_SENT: "Follow-up sent",
  REPLY_DETECTED: "Reply detected",
  POSITIVE_MARKED: "Positive reply",
  MEETING_BOOKED: "Meeting booked",
  CAMPAIGN_STARTED: "Campaign started",
  CAMPAIGN_PAUSED: "Campaign paused",
  CAMPAIGN_STOPPED: "Campaign stopped",
  LEAD_CREATED: "Lead created",
  EMAIL_FAILED: "Email failed",
  FOLLOWUP_FAILED: "Follow-up failed",
  BOUNCED: "Bounced",
};

const EVENT_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  REPLY_DETECTED: "success",
  POSITIVE_MARKED: "success",
  MEETING_BOOKED: "success",
  EMAIL_FAILED: "destructive",
  FOLLOWUP_FAILED: "destructive",
  BOUNCED: "destructive",
  CAMPAIGN_PAUSED: "warning",
  CAMPAIGN_STOPPED: "warning",
};

export default function DashboardPage() {
  const { data: summary, isLoading: loadingStats } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", "summary"],
    queryFn: () => fetch("/api/analytics").then((r) => r.json()).then((d) => d.data),
  });

  const { data: events, isLoading: loadingEvents } = useQuery<LeadEvent[]>({
    queryKey: ["events", "recent"],
    queryFn: () => fetch("/api/events?limit=15").then((r) => r.json()).then((d) => d.data),
  });

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetch("/api/campaigns").then((r) => r.json()).then((d) => d.data ?? []),
  });

  const activeCampaigns = (campaigns ?? []).filter((c: { status: string }) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of your cold email activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Emails Sent"
          value={loadingStats ? "—" : (summary?.totalSent ?? 0).toLocaleString()}
          sub="all time"
          icon={Send}
          color="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Replies"
          value={loadingStats ? "—" : (summary?.totalReplies ?? 0).toLocaleString()}
          sub={summary ? `${(summary.replyRate * 100).toFixed(1)}% rate` : undefined}
          icon={TrendingUp}
          color="bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          label="Positive"
          value={loadingStats ? "—" : (summary?.totalPositive ?? 0).toLocaleString()}
          sub={summary ? `${(summary.positiveRate * 100).toFixed(1)}% rate` : undefined}
          icon={ThumbsUp}
          color="bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Meetings Booked"
          value={loadingStats ? "—" : (summary?.totalBooked ?? 0).toLocaleString()}
          sub="all time"
          icon={Calendar}
          color="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : !events?.length ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Badge variant={EVENT_VARIANT[ev.type] ?? "secondary"}>
                        {EVENT_LABELS[ev.type] ?? ev.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatRelative(ev.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/40">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active campaigns</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40">
                  <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bounced</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary?.totalBounced ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {summary?.topCampaigns?.length ? (
            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm">Top Campaign</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{summary.topCampaigns[0].name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {summary.topCampaigns[0].sent} sent · {(summary.topCampaigns[0].replyRate * 100).toFixed(1)}% replies
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
