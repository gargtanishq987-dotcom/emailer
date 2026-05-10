"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, Mail, RefreshCw, Send, ThumbsUp, Calendar, AlertTriangle, Play, Pause, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRelative } from "@/lib/utils";

type EnrichedEvent = {
  id: string;
  type: string;
  leadId: string;
  campaignId: string;
  inboxId: string | null;
  metadata: Record<string, unknown>;
  timestamp: number;
  leadEmail: string | null;
  leadName: string | null;
  campaignName: string | null;
  inboxEmail: string | null;
};

const EVENT_CONFIG: Record<string, { label: string; icon: React.ElementType; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  EMAIL_SENT:        { label: "Email sent",        icon: Send,          variant: "default" },
  FOLLOWUP_SENT:     { label: "Follow-up sent",    icon: Send,          variant: "default" },
  FOLLOWUP_SCHEDULED:{ label: "Follow-up sched.",  icon: Clock,         variant: "secondary" },
  REPLY_DETECTED:    { label: "Reply detected",    icon: Mail,          variant: "success" },
  POSITIVE_MARKED:   { label: "Positive reply",    icon: ThumbsUp,      variant: "success" },
  MEETING_BOOKED:    { label: "Meeting booked",    icon: Calendar,      variant: "success" },
  CAMPAIGN_STARTED:  { label: "Campaign started",  icon: Play,          variant: "success" },
  CAMPAIGN_PAUSED:   { label: "Campaign paused",   icon: Pause,         variant: "warning" },
  CAMPAIGN_STOPPED:  { label: "Campaign stopped",  icon: Square,        variant: "warning" },
  LEAD_CREATED:      { label: "Lead imported",     icon: Activity,      variant: "secondary" },
  EMAIL_FAILED:      { label: "Send failed",       icon: AlertTriangle, variant: "destructive" },
  FOLLOWUP_FAILED:   { label: "Follow-up failed",  icon: AlertTriangle, variant: "destructive" },
  BOUNCED:           { label: "Bounced",           icon: AlertTriangle, variant: "destructive" },
  EMAIL_QUEUED:      { label: "Queued",            icon: Clock,         variant: "secondary" },
};

const ALL_TYPES = Object.keys(EVENT_CONFIG);

export default function LogsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  const { data: events, isLoading, refetch, isFetching } = useQuery<EnrichedEvent[]>({
    queryKey: ["events", "logs", limit],
    queryFn: () => fetch(`/api/events?enrich=1&limit=${limit}`).then((r) => r.json()).then((d) => d.data ?? []),
    refetchInterval: 30_000,
  });

  const filtered = typeFilter === "all"
    ? (events ?? [])
    : (events ?? []).filter((ev) => ev.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Email sending activity · auto-refreshes every 30s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{EVENT_CONFIG[t]?.label ?? t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[25, 50, 100, 200].map((n) => (
              <SelectItem key={n} value={String(n)}>Last {n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isLoading && (
          <span className="text-xs text-gray-400">{filtered.length} events</span>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !filtered.length ? (
            <div className="text-center py-16">
              <Activity className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No events yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((ev) => {
                const cfg = EVENT_CONFIG[ev.type];
                const Icon = cfg?.icon ?? Activity;
                return (
                  <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      cfg?.variant === "success" ? "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400" :
                      cfg?.variant === "destructive" ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400" :
                      cfg?.variant === "warning" ? "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400" :
                      "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {cfg?.label ?? ev.type}
                        </span>
                        {ev.leadEmail && (
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                            → {ev.leadEmail}
                            {ev.leadName && ev.leadName !== ev.leadEmail && ` (${ev.leadName})`}
                          </span>
                        )}
                        {ev.inboxEmail && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            from {ev.inboxEmail}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {ev.campaignName && (
                          <span className="text-xs text-gray-400">{ev.campaignName}</span>
                        )}
                        {/* Show same-inbox confirmation for follow-ups */}
                        {ev.type === "FOLLOWUP_SENT" && ev.metadata?.sameInboxAsInitial === true && (
                          <span className="text-xs text-green-600 dark:text-green-400">✓ same inbox</span>
                        )}
                        {/* Show error details */}
                        {(ev.type === "EMAIL_FAILED" || ev.type === "FOLLOWUP_FAILED") && typeof ev.metadata?.error === "string" && (
                          <span className="text-xs text-red-500">{ev.metadata.error}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatRelative(ev.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
