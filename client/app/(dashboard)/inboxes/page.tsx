"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusIcon, Inbox, MoreVertical, Trash2, Edit2, Mail, Send, Loader2, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Inbox as InboxType } from "@/lib/types";
import type { InboxUpdateInput } from "@/lib/validations";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Singapore",
  "Australia/Sydney",
];

function TestSendDialog({ inbox, open, onOpenChange }: { inbox: InboxType; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Test email");
  const [body, setBody] = useState("Hi, this is a test email sent from the cold email platform.");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxId: inbox.id, to, subject, body }),
      }).then((r) => r.json());
      if (res.success) {
        toast.success(`Test email sent to ${to}`);
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Send failed");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>Send a test email from {inbox.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Body (plain text)</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={!to || sending}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InboxCard({ inbox }: { inbox: InboxType }) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<InboxUpdateInput>({
    defaultValues: {
      dailyLimit: inbox.dailyLimit,
      timezone: inbox.timezone,
      sendingWindowStart: inbox.sendingWindowStart,
      sendingWindowEnd: inbox.sendingWindowEnd,
      status: inbox.status as "active" | "paused",
    },
  });

  const patchInbox = async (data: Partial<InboxUpdateInput>) => {
    const res = await fetch(`/api/inboxes/${inbox.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...inbox, ...data }),
    }).then((r) => r.json());
    if (res.success) {
      qc.invalidateQueries({ queryKey: ["inboxes"] });
    } else {
      toast.error(res.error ?? "Failed to update");
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: InboxUpdateInput) =>
      fetch(`/api/inboxes/${inbox.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Inbox updated");
        qc.invalidateQueries({ queryKey: ["inboxes"] });
        setEditOpen(false);
      } else {
        toast.error(res.error ?? "Failed to update");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/inboxes/${inbox.id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Inbox removed");
        qc.invalidateQueries({ queryKey: ["inboxes"] });
      } else {
        toast.error(res.error ?? "Failed to delete");
      }
    },
  });

  const sentPct = inbox.dailyLimit > 0 ? Math.min((inbox.sentToday / inbox.dailyLimit) * 100, 100) : 0;

  function adjustLimit(delta: number) {
    const newLimit = Math.max(1, Math.min(500, inbox.dailyLimit + delta));
    if (newLimit !== inbox.dailyLimit) {
      patchInbox({ dailyLimit: newLimit });
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{inbox.displayName || inbox.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{inbox.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={inbox.status === "active"}
                onCheckedChange={(checked) => patchInbox({ status: checked ? "active" : "paused" })}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTestOpen(true)}>
                    <Send className="h-4 w-4 mr-2" /> Send test email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-400 focus:text-red-600"
                    onClick={() => { if (confirm("Remove this inbox?")) deleteMutation.mutate(); }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Daily limit stepper */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Daily limit</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => adjustLimit(-5)}
                  disabled={inbox.dailyLimit <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100 w-10 text-center">
                  {inbox.dailyLimit}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => adjustLimit(5)}
                  disabled={inbox.dailyLimit >= 500}
                >
                  <PlusIcon className="h-3 w-3" />
                </Button>
                <span className="text-xs text-gray-400">/day</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Sent today</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {inbox.sentToday}
                <span className="text-sm font-normal text-gray-400">/{inbox.dailyLimit}</span>
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${sentPct >= 90 ? "bg-red-500" : sentPct >= 60 ? "bg-yellow-500" : "bg-blue-500"}`}
                style={{ width: `${sentPct}%` }}
              />
            </div>
          </div>

          {/* Health & window */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>{inbox.sendingWindowStart}–{inbox.sendingWindowEnd}</span>
              <span>·</span>
              <span className="truncate max-w-[120px]">{inbox.timezone}</span>
            </div>
            <Badge variant={inbox.health === "good" ? "success" : inbox.health === "warning" ? "warning" : "destructive"}>
              {inbox.health}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inbox</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d as InboxUpdateInput))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Daily limit</Label>
              <Input type="number" min={1} max={500} {...register("dailyLimit", { valueAsNumber: true })} />
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
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={watch("timezone")} onValueChange={(v) => setValue("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TestSendDialog inbox={inbox} open={testOpen} onOpenChange={setTestOpen} />
    </>
  );
}

export default function InboxesPage() {
  const { data: inboxes, isLoading } = useQuery<InboxType[]>({
    queryKey: ["inboxes"],
    queryFn: () => fetch("/api/inboxes").then((r) => r.json()).then((d) => d.data ?? []),
  });

  const [search, setSearch] = useState("");

  function handleConnectGmail() {
    window.location.href = "/api/gmail/auth";
  }

  const filtered = (inboxes ?? []).filter((i) =>
    i.email.toLowerCase().includes(search.toLowerCase()) ||
    i.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = (inboxes ?? []).filter((i) => i.status === "active").length;
  const totalSentToday = (inboxes ?? []).reduce((sum, i) => sum + (i.sentToday ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inboxes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {activeCount} active · {totalSentToday} sent today
          </p>
        </div>
        <Button onClick={handleConnectGmail}>
          <PlusIcon className="h-4 w-4" />
          Connect Gmail
        </Button>
      </div>

      {inboxes && inboxes.length > 3 && (
        <Input
          placeholder="Search inboxes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-16">
          <Inbox className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {inboxes?.length ? "No inboxes match your search" : "No inboxes connected yet"}
          </p>
          {!inboxes?.length && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400">First configure your Gmail credentials in Settings → API & Credentials</p>
              <Button onClick={handleConnectGmail}>Connect your first inbox</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inbox) => (
            <InboxCard key={inbox.id} inbox={inbox} />
          ))}
        </div>
      )}
    </div>
  );
}

