import type { Role, LineOfBusiness } from "./api";

/** Bound sums are whole-dollar integers; render them plainly. */
export function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US");
}

export function when(epochMs: number | null | undefined): string {
  if (!epochMs) return "";
  const d = new Date(epochMs);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ROLE_LABELS: Record<Role, string> = {
  underwriter: "Underwriter",
  senior_underwriter: "Senior underwriter",
  admin: "Admin",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role as Role] ?? role;
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const LINES: LineOfBusiness[] = ["property", "casualty", "auto", "marine"];

export function canAssign(role: string | null | undefined): boolean {
  return role === "senior_underwriter" || role === "admin";
}
