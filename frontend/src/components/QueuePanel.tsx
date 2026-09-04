import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ApiError,
  createSubmission,
  listQueue,
  type Me,
  type QueueRow,
  type LineOfBusiness,
} from "@/lib/api";
import { LINES, money, titleCase } from "@/lib/format";

const STATUSES = ["new", "assigned", "decisioned", "referred"];

export function QueuePanel({
  token,
  me,
  selectedId,
  onSelect,
  refreshKey,
}: {
  token: string;
  me: Me;
  selectedId: number | null;
  onSelect: (id: number) => void;
  refreshKey: number;
}) {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [line, setLine] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [applicant, setApplicant] = useState("");
  const [formLine, setFormLine] = useState<LineOfBusiness>("property");
  const [bound, setBound] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listQueue(token, { status, line_of_business: line }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the queue.");
    } finally {
      setLoading(false);
    }
  }, [token, status, line]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createSubmission(token, {
        applicant_name: applicant,
        line_of_business: formLine,
        bound_sum: Number(bound),
      });
      setApplicant("");
      setBound("");
      setShowForm(false);
      await load();
      if (created?.id) onSelect(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the submission.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">Submission queue</h2>
          <p className="text-muted-foreground text-xs">{rows.length} submissions</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus /> New
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submitNew} className="bg-muted/40 space-y-3 border-b p-4">
          <div>
            <Label htmlFor="applicant">Applicant</Label>
            <Input
              id="applicant"
              required
              value={applicant}
              onChange={(e) => setApplicant(e.target.value)}
              placeholder="Riverside Logistics"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="line">Line of business</Label>
              <Select
                id="line"
                value={formLine}
                onChange={(e) => setFormLine(e.target.value as LineOfBusiness)}
              >
                {LINES.map((l) => (
                  <option key={l} value={l}>
                    {titleCase(l)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="bound">Bound sum ($)</Label>
              <Input
                id="bound"
                type="number"
                min="0"
                required
                value={bound}
                onChange={(e) => setBound(e.target.value)}
                placeholder="75000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || !applicant || !bound}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </form>
      )}

      <div className="flex gap-2 border-b p-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
        <Select value={line} onChange={(e) => setLine(e.target.value)}>
          <option value="">All lines</option>
          {LINES.map((l) => (
            <option key={l} value={l}>
              {titleCase(l)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <p className="text-destructive p-4 text-sm">{error}</p>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-sm">
            <Search className="size-5" /> No submissions match.
          </div>
        ) : (
          <ul>
            {rows.map((row) => {
              const over = row.bound_sum > (me.authority_limit ?? 0);
              return (
                <li key={row.id}>
                  <button
                    onClick={() => onSelect(row.id)}
                    className={
                      "hover:bg-accent/60 flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left transition-colors " +
                      (selectedId === row.id ? "bg-accent" : "")
                    }
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.applicant_name}</p>
                      <p className="text-muted-foreground text-xs">
                        {titleCase(row.line_of_business)} · {money(row.bound_sum)}
                        {over && <span className="text-red-400"> · over your limit</span>}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
