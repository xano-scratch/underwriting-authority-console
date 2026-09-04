import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Send, ShieldAlert, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge, ActionBadge } from "@/components/StatusBadge";
import {
  ApiError,
  assignSubmission,
  decideSubmission,
  getSubmission,
  listUnderwriters,
  referSubmission,
  type Me,
  type SubmissionDetail,
  type Underwriter,
} from "@/lib/api";
import { canAssign, money, roleLabel, titleCase, when } from "@/lib/format";

type Notice = { tone: "referred" | "ok" | "error"; text: string };

export function DetailPanel({
  token,
  me,
  submissionId,
  onChanged,
  onClose,
}: {
  token: string;
  me: Me;
  submissionId: number;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [underwriters, setUnderwriters] = useState<Underwriter[]>([]);
  const [assignee, setAssignee] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getSubmission(token, submissionId));
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof ApiError ? err.message : "Load failed." });
    } finally {
      setLoading(false);
    }
  }, [token, submissionId]);

  useEffect(() => {
    setNotice(null);
    setAssignee("");
    void load();
  }, [load]);

  useEffect(() => {
    if (canAssign(me.role)) listUnderwriters(token).then(setUnderwriters).catch(() => {});
  }, [token, me.role]);

  const sub = data?.submission;

  async function run(label: string, fn: () => Promise<unknown>, okText: string) {
    setActing(label);
    setNotice(null);
    try {
      await fn();
      setNotice({ tone: "ok", text: okText });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setNotice({ tone: "referred", text: err.message });
      } else {
        setNotice({ tone: "error", text: err instanceof ApiError ? err.message : "Action failed." });
      }
    } finally {
      setActing(null);
      await load();
      onChanged();
    }
  }

  if (loading && !data) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" /> Loading submission…
      </div>
    );
  }
  if (!sub) {
    return <div className="text-muted-foreground py-16 text-center text-sm">Submission not found.</div>;
  }

  const overLimit = sub.bound_sum > (me.authority_limit ?? 0);
  const decided = sub.status === "decisioned";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold">{sub.applicant_name}</h2>
            <StatusBadge status={sub.status} />
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {titleCase(sub.line_of_business)} · Bound sum {money(sub.bound_sum)}
            {sub.decision ? ` · ${titleCase(sub.decision)}` : ""}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
          <X />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {notice && (
          <div
            className={
              "rounded-lg border px-3 py-2 text-sm " +
              (notice.tone === "referred"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : notice.tone === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300")
            }
          >
            <div className="flex items-start gap-2">
              {notice.tone === "referred" && <ShieldAlert className="mt-0.5 size-4 shrink-0" />}
              <span>{notice.text}</span>
            </div>
          </div>
        )}

        {/* Decision panel */}
        <section className="bg-muted/40 rounded-lg border p-3">
          <h3 className="mb-2 text-sm font-medium">Decision</h3>
          <p className="text-muted-foreground mb-3 text-xs">
            Your authority limit is {money(me.authority_limit)}. This bound sum is {money(sub.bound_sum)}.{" "}
            {overLimit ? (
              <span className="text-red-400">
                Over your limit — an approve or decline here is refused by the API and referred.
              </span>
            ) : (
              <span className="text-emerald-400">Within your authority.</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={acting !== null || decided}
              onClick={() => run("approve", () => decideSubmission(token, sub.id, "approved"), "Approved.")}
            >
              {acting === "approve" ? <Loader2 className="size-4 animate-spin" /> : <Check />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={acting !== null || decided}
              onClick={() => run("decline", () => decideSubmission(token, sub.id, "declined"), "Declined.")}
            >
              {acting === "decline" ? <Loader2 className="size-4 animate-spin" /> : <X />}
              Decline
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={acting !== null || decided}
              onClick={() => run("refer", () => referSubmission(token, sub.id), "Referred to senior review.")}
            >
              {acting === "refer" ? <Loader2 className="size-4 animate-spin" /> : <Send />}
              Refer
            </Button>
          </div>
          {decided && (
            <p className="text-muted-foreground mt-2 text-xs">This submission is decisioned and locked.</p>
          )}
        </section>

        {/* Assign panel — senior/admin only */}
        {canAssign(me.role) && (
          <section className="bg-muted/40 rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-medium">Assign</h3>
            <div className="flex gap-2">
              <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Select an underwriter…</option>
                {underwriters.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {roleLabel(String(u.role))}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                disabled={acting !== null || !assignee}
                onClick={() =>
                  run("assign", () => assignSubmission(token, sub.id, Number(assignee)), "Assigned.")
                }
              >
                {acting === "assign" ? <Loader2 className="size-4 animate-spin" /> : <UserPlus />}
                Assign
              </Button>
            </div>
          </section>
        )}

        {/* Audit trail */}
        <section>
          <h3 className="mb-2 text-sm font-medium">Audit trail</h3>
          <ol className="space-y-2">
            {data?.events.map((ev) => (
              <li key={ev.id} className="bg-card flex gap-3 rounded-lg border p-3">
                <ActionBadge action={String(ev.action)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{String(ev.detail)}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {ev.actor_name ? String(ev.actor_name) : "System"} · {when(Number(ev.at))}
                  </p>
                </div>
              </li>
            ))}
            {data && data.events.length === 0 && (
              <li className="text-muted-foreground text-sm">No events yet.</li>
            )}
          </ol>
        </section>
      </div>
    </div>
  );
}
