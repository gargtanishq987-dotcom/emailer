"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  Plus, Send, MoreVertical, Play, Pause, Square, Copy, Trash2,
  Users, TrendingUp, Clock, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Campaign, Inbox } from "@/lib/types";
import type { CampaignInput } from "@/lib/validations";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  completed: "default",
  stopped: "destructive",
};

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo",
];

function CampaignForm({
  inboxes,
  onSubmit,
  loading,
}: {
  inboxes: Inbox[];
  onSubmit: (data: CampaignInput) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<CampaignInput>({
    defaultValues: {
      name: "",
      assignedInboxIds: [],
      dailyLimit: 50,
      timezone: "America/New_York",
      sendingWindowStart: "09:00",
      sendingWindowEnd: "17:00",
      minDelaySec: 60,
      maxDelaySec: 300,
      followUpDelayDays: [3, 5],
    },
  });

  const selectedInboxIds = watch("assignedInboxIds") ?? [];

  function toggleInbox(id: string) {
    const current = selectedInboxIds;
    const next = current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id];
    setValue("assignedInboxIds", next, { shouldDirty: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Campaign name *</Label>
        <Input placeholder="Q1 Outreach" {...register("name", { required: "Name is required" })} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Assigned inboxes *</Label>
        <div className="space-y-1.5 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
          {inboxes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No active inboxes. Connect one first.</p>
          ) : (
            inboxes.map((inbox) => (
              <label key={inbox.id} className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded accent-blue-600"
                  checked={selectedInboxIds.includes(inbox.id)}
                  onChange={() => toggleInbox(inbox.id)}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{inbox.email}</span>
              </label>
            ))
          )}
        </div>
        {errors.assignedInboxIds && <p className="text-xs text-red-500">At least one inbox required</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Daily limit</Label>
          <Input type="number" min={1} max={1000} {...register("dailyLimit", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz.split("/")[1]}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Window start</Label>
          <Input type="time" {...register("sendingWindowStart")} />
        </div>
        <div className="space-y-1.5">
          <Label>Window end</Label>
          <Input type="time" {...register("sendingWindowEnd")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Min delay (sec)</Label>
          <Input type="number" min={30} {...register("minDelaySec", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Max delay (sec)</Label>
          <Input type="number" min={30} {...register("maxDelaySec", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Follow-up delays (days, comma-separated, max 3)</Label>
        <Input
          placeholder="3, 5, 7"
          defaultValue="3, 5"
          onChange={(e) => {
            const vals = e.target.value.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)).slice(0, 3);
            setValue("followUpDelayDays", vals);
          }}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>Create Campaign</Button>
      </DialogFooter>
    </form>
  );
}

function CampaignCard({ campaign, inboxes }: { campaign: Campaign; inboxes: Inbox[] }) {
  const qc = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: (action: string) =>
      fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then((r) => r.json()),
    onSuccess: (res, action) => {
      if (res.success) {
        toast.success(`Campaign ${action}ed`);
        qc.invalidateQueries({ queryKey: ["campaigns"] });
      } else {
        toast.error(res.error ?? "Action failed");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Campaign deleted");
        qc.invalidateQueries({ queryKey: ["campaigns"] });
      } else {
        toast.error(res.error ?? "Delete failed");
      }
    },
  });

  const replyRate = campaign.sentCount > 0 ? ((campaign.replyCount / campaign.sentCount) * 100).toFixed(1) : "0";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{campaign.name}</h3>
              <Badge variant={STATUS_VARIANT[campaign.status]}>{campaign.status}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Created {formatDate(campaign.createdAt)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {campaign.status === "draft" && (
                <DropdownMenuItem onClick={() => actionMutation.mutate("start")}>
                  <Play className="h-4 w-4 mr-2" /> Start
                </DropdownMenuItem>
              )}
              {campaign.status === "active" && (
                <DropdownMenuItem onClick={() => actionMutation.mutate("pause")}>
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </DropdownMenuItem>
              )}
              {campaign.status === "paused" && (
                <DropdownMenuItem onClick={() => actionMutation.mutate("resume")}>
                  <Play className="h-4 w-4 mr-2" /> Resume
                </DropdownMenuItem>
              )}
              {(campaign.status === "active" || campaign.status === "paused") && (
                <DropdownMenuItem onClick={() => actionMutation.mutate("stop")}>
                  <Square className="h-4 w-4 mr-2" /> Stop
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => actionMutation.mutate("duplicate")}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400 focus:text-red-600"
                onClick={() => { if (confirm("Delete campaign?")) deleteMutation.mutate(); }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{campaign.totalLeads}</p>
            <p className="text-xs text-gray-500">Leads</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{campaign.sentCount}</p>
            <p className="text-xs text-gray-500">Sent</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{replyRate}%</p>
            <p className="text-xs text-gray-500">Reply rate</p>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{campaign.bookedCount}</p>
            <p className="text-xs text-gray-500">Booked</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {campaign.sendingWindowStart}–{campaign.sendingWindowEnd} · {campaign.dailyLimit}/day
          </div>
          <Link href={`/campaigns/${campaign.id}`} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data: campaigns, isLoading, error } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const r = await fetch("/api/campaigns");
      const d = await r.json();
      if (!d.success) throw new Error(d.error ?? "Failed to load campaigns");
      return d.data ?? [];
    },
  });

  const { data: inboxes } = useQuery<Inbox[]>({
    queryKey: ["inboxes"],
    queryFn: () => fetch("/api/inboxes").then((r) => r.json()).then((d) => d.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignInput) =>
      fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Campaign created");
        qc.invalidateQueries({ queryKey: ["campaigns"] });
        setCreateOpen(false);
      } else {
        toast.error(res.error ?? "Failed to create");
      }
    },
  });

  const activeInboxes = (inboxes ?? []).filter((i) => i.status === "active");

  const filtered = (campaigns ?? []).filter((c) => filter === "all" || c.status === filter);

  const statuses = ["all", "draft", "active", "paused", "completed", "stopped"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campaigns</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your email campaigns</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {statuses.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s}
            {s !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                {(campaigns ?? []).filter((c) => c.status === s).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
          Error: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (

        <div className="text-center py-16">
          <Send className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {campaigns?.length ? "No campaigns match this filter" : "No campaigns yet"}
          </p>
          {!campaigns?.length && (
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>Create your first campaign</Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} inboxes={inboxes ?? []} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Configure your new email campaign</DialogDescription>
          </DialogHeader>
          <CampaignForm
            inboxes={activeInboxes}
            onSubmit={(d) => createMutation.mutate(d)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
