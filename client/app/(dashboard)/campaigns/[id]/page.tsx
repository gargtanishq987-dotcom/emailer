"use client";

import { use, useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  ArrowLeft, Play, Pause, Square, Upload, Users, Send, TrendingUp,
  Calendar, MoreVertical, Loader2, FileText, ClipboardPaste, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import type { Campaign, Lead, Inbox } from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "secondary",
  queued: "default",
  sent: "default",
  replied: "success",
  positive: "success",
  booked: "success",
  bounced: "destructive",
  unsubscribed: "warning",
};

const CAMPAIGN_STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  completed: "default",
  stopped: "destructive",
};

const CSV_TEMPLATE = `first_name,last_name,company,email,subject,body,followup_1,followup_2,followup_3
John,Doe,Acme Corp,john@acme.com,Quick question about {{company}},Hi {{first_name}},\n\nI noticed that {{company}} is growing fast and wanted to reach out.\n\nWould you be open to a quick 15-min chat?\n\nBest,\n[Your Name],Hi {{first_name}},\n\nJust following up on my last email — any thoughts?\n\nBest,\n[Your Name],,`;

function ImportDialog({
  open,
  onOpenChange,
  campaignId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaignId: string;
  onSuccess: () => void;
}) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [filename, setFilename] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseRows(content: string, name?: string) {
    setParseErrors([]);
    Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          setParseErrors(results.errors.map((e) => e.message));
        }
        setRows(results.data);
        if (name) setFilename(name);
      },
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseRows(ev.target?.result as string, file.name);
    reader.readAsText(file);
  }

  function handleParsePaste() {
    if (!pasteText.trim()) return;
    parseRows(pasteText);
  }

  async function handleImport() {
    if (!rows.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, leads: rows }),
      }).then((r) => r.json());

      if (res.success) {
        const { imported, errors } = res.data;
        if (errors.length) {
          toast.warning(`Imported ${imported} leads, ${errors.length} rows had errors`);
        } else {
          toast.success(`Imported ${imported} leads`);
        }
        onSuccess();
        onOpenChange(false);
        setRows([]);
        setFilename("");
        setPasteText("");
      } else {
        toast.error(res.error ?? "Import failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Required columns: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">first_name, email, subject, body</code>.
            Optional: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">last_name, company, followup_1, followup_2, followup_3</code>.
            Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{"{{first_name}}"}</code> for placeholders. Plain text only.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file">
          <TabsList className="mb-4">
            <TabsTrigger value="file"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload CSV</TabsTrigger>
            <TabsTrigger value="paste"><ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />Paste CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filename ? (
                  <span className="font-medium text-blue-600">{filename} — {rows.length} rows parsed</span>
                ) : (
                  "Click to select a .csv file"
                )}
              </p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </div>
          </TabsContent>

          <TabsContent value="paste">
            <div className="space-y-3">
              <textarea
                className="flex min-h-[200px] w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-mono resize-y"
                placeholder={`Paste CSV content here, e.g.:\n\nfirst_name,email,subject,body\nJohn,john@acme.com,Quick question,Hi John\\n\\nWanted to reach out...`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={handleParsePaste} disabled={!pasteText.trim()}>
                Parse CSV
              </Button>
              {rows.length > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">{rows.length} rows parsed successfully</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Template download */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => {
              const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "leads_template.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download template CSV
          </button>
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-400 space-y-1">
              {parseErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  {Object.keys(rows[0]).map((k) => (
                    <th key={k} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 3 && (
              <p className="text-center text-xs text-gray-400 py-2">+ {rows.length - 3} more rows</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!rows.length || importing}>
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {rows.length > 0 ? `${rows.length} leads` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);

  const { data: campaign, isLoading: loadingCampaign } = useQuery<Campaign>({
    queryKey: ["campaign", id],
    queryFn: () => fetch(`/api/campaigns/${id}`).then((r) => r.json()).then((d) => d.data),
  });

  const { data: leads, isLoading: loadingLeads } = useQuery<Lead[]>({
    queryKey: ["leads", id],
    queryFn: () => fetch(`/api/leads?campaignId=${id}`).then((r) => r.json()).then((d) => d.data ?? []),
  });

  const { data: inboxes } = useQuery<Inbox[]>({
    queryKey: ["inboxes"],
    queryFn: () => fetch("/api/inboxes").then((r) => r.json()).then((d) => d.data ?? []),
  });

  const inboxMap = Object.fromEntries((inboxes ?? []).map((i) => [i.id, i]));

  const actionMutation = useMutation({
    mutationFn: (action: string) =>
      fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then((r) => r.json()),
    onSuccess: (res, action) => {
      if (res.success) {
        toast.success(`Campaign ${action}ed`);
        qc.invalidateQueries({ queryKey: ["campaign", id] });
        qc.invalidateQueries({ queryKey: ["leads", id] });
        qc.invalidateQueries({ queryKey: ["campaigns"] });
      } else {
        toast.error(res.error ?? "Action failed");
      }
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: Record<string, unknown> }) =>
      fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", id] });
    },
  });

  if (loadingCampaign) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Campaign not found</p>
        <Link href="/campaigns">
          <Button className="mt-4" variant="outline">Back to campaigns</Button>
        </Link>
      </div>
    );
  }

  const replyRate = campaign.sentCount > 0
    ? ((campaign.replyCount / campaign.sentCount) * 100).toFixed(1)
    : "0";

  const positiveLeads = (leads ?? []).filter((l) => l.positiveReply);
  const bookedLeads = (leads ?? []).filter((l) => l.bookedMeeting);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{campaign.name}</h1>
            <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status]}>{campaign.status}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Created {formatDate(campaign.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {campaign.status === "draft" && (
            <Button size="sm" onClick={() => actionMutation.mutate("start")}>
              <Play className="h-4 w-4" /> Start
            </Button>
          )}
          {campaign.status === "active" && (
            <Button size="sm" variant="outline" onClick={() => actionMutation.mutate("pause")}>
              <Pause className="h-4 w-4" /> Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button size="sm" onClick={() => actionMutation.mutate("resume")}>
              <Play className="h-4 w-4" /> Resume
            </Button>
          )}
          {(campaign.status === "active" || campaign.status === "paused") && (
            <Button size="sm" variant="destructive" onClick={() => { if (confirm("Stop this campaign?")) actionMutation.mutate("stop"); }}>
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Import leads
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total leads", value: campaign.totalLeads, icon: Users },
          { label: "Sent", value: campaign.sentCount, icon: Send },
          { label: "Reply rate", value: `${replyRate}%`, icon: TrendingUp },
          { label: "Positive", value: positiveLeads.length, icon: TrendingUp },
          { label: "Meetings", value: bookedLeads.length, icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Daily limit</p>
              <p className="font-medium">{campaign.dailyLimit}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Sending window</p>
              <p className="font-medium">{campaign.sendingWindowStart}–{campaign.sendingWindowEnd}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Delay range</p>
              <p className="font-medium">{campaign.minDelaySec}–{campaign.maxDelaySec}s</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Follow-up delays</p>
              <p className="font-medium">{campaign.followUpDelayDays?.join(", ") || "None"} days</p>
            </div>
          </div>
          {campaign.assignedInboxIds?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 mb-1.5">Sending inboxes</p>
              <div className="flex flex-wrap gap-1.5">
                {campaign.assignedInboxIds.map((iid) => (
                  <Badge key={iid} variant="secondary">
                    {inboxMap[iid]?.email ?? iid}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Leads ({leads?.length ?? 0})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLeads ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !leads?.length ? (
            <div className="text-center py-12">
              <Users className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No leads imported yet</p>
              <Button className="mt-3" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sending inbox</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const sendingInbox = inboxMap[lead.inboxId];
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.firstName} {lead.lastName}
                          {lead.company && <span className="text-gray-400 text-xs ml-1">· {lead.company}</span>}
                        </TableCell>
                        <TableCell className="text-gray-500 text-xs">{lead.email}</TableCell>
                        <TableCell className="text-xs">
                          {sendingInbox ? (
                            <span className="text-gray-600 dark:text-gray-400">{sendingInbox.email}</span>
                          ) : lead.inboxId ? (
                            <span className="text-gray-400">ID: {lead.inboxId.slice(0, 8)}…</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant={STATUS_VARIANT[lead.status]}>{lead.status}</Badge>
                            {lead.positiveReply && <Badge variant="success">positive</Badge>}
                            {lead.bookedMeeting && <Badge variant="success">booked</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          #{lead.currentFollowUp} · {lead.nextFollowUpAt ? formatRelative(lead.nextFollowUpAt) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{formatRelative(lead.sentAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!lead.positiveReply && (
                                <DropdownMenuItem onClick={() => updateLeadMutation.mutate({ leadId: lead.id, data: { positiveReply: true } })}>
                                  Mark positive reply
                                </DropdownMenuItem>
                              )}
                              {!lead.bookedMeeting && (
                                <DropdownMenuItem onClick={() => updateLeadMutation.mutate({ leadId: lead.id, data: { bookedMeeting: true } })}>
                                  Mark meeting booked
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        campaignId={id}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["leads", id] });
          qc.invalidateQueries({ queryKey: ["campaign", id] });
          qc.invalidateQueries({ queryKey: ["campaigns"] });
        }}
      />
    </div>
  );
}
