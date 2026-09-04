import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "secondary";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  new: "info",
  assigned: "warning",
  decisioned: "success",
  referred: "danger",
};

const ACTION_VARIANT: Record<string, BadgeVariant> = {
  created: "info",
  assigned: "warning",
  decisioned: "success",
  referred: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>{titleCase(status)}</Badge>;
}

export function ActionBadge({ action }: { action: string }) {
  return <Badge variant={ACTION_VARIANT[action] ?? "secondary"}>{titleCase(action)}</Badge>;
}
