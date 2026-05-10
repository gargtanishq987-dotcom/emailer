"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Send, TrendingUp, ThumbsUp, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsSummary } from "@/lib/types";

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

function StatCard({ label, value, sub, icon: Icon, color }: {
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

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: summary, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", days],
    queryFn: () => fetch(`/api/analytics?days=${days}`).then((r) => r.json()).then((d) => d.data),
  });

  const chartData = summary?.dailyData ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Email performance metrics</p>
        </div>
        <div className="flex gap-1.5">
          {DAYS_OPTIONS.map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Emails Sent"
          value={isLoading ? "—" : (summary?.totalSent ?? 0).toLocaleString()}
          icon={Send}
          color="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Replies"
          value={isLoading ? "—" : (summary?.totalReplies ?? 0).toLocaleString()}
          sub={summary ? `${(summary.replyRate * 100).toFixed(1)}% rate` : undefined}
          icon={TrendingUp}
          color="bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          label="Positive"
          value={isLoading ? "—" : (summary?.totalPositive ?? 0).toLocaleString()}
          sub={summary ? `${(summary.positiveRate * 100).toFixed(1)}% rate` : undefined}
          icon={ThumbsUp}
          color="bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Bounced"
          value={isLoading ? "—" : (summary?.totalBounced ?? 0).toLocaleString()}
          icon={AlertTriangle}
          color="bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
        />
      </div>

      {/* Line chart */}
      <Card>
        <CardHeader>
          <CardTitle>Email Activity ({days} days)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-background, #fff)",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sent" />
                <Line type="monotone" dataKey="replies" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Replies" />
                <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={false} name="Positive" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Top Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary?.topCampaigns?.length ? (
              <p className="text-sm text-gray-500 py-4 text-center">No campaign data</p>
            ) : (
              <div className="space-y-3">
                {summary.topCampaigns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.sent.toLocaleString()} sent</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary">{(c.replyRate * 100).toFixed(1)}% reply</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top inboxes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Inboxes</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary?.topInboxes?.length ? (
              <p className="text-sm text-gray-500 py-4 text-center">No inbox data</p>
            ) : (
              <div className="space-y-3">
                {summary.topInboxes.map((inbox, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{inbox.email}</p>
                      <p className="text-xs text-gray-500">{inbox.sent.toLocaleString()} sent</p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant="secondary">{(inbox.replyRate * 100).toFixed(1)}% reply</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
