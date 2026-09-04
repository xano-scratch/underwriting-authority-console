// The one contract: paths and request/response *types* are derived from the
// xanots query defs, never hand-typed. Change a def and everything here follows.
//
// The query defs are lean (no agent/tool graphs), so importing them for
// getPath()/verb is cheap; the shapes come in type-only and erase to nothing.

import type { InferInput, InferResponse } from "@xanots/sdk";

import { loginQuery } from "../../../xano/api/login.js";
import { meQuery } from "../../../xano/api/me.js";
import { createSubmissionQuery } from "../../../xano/api/submissions-create.js";
import { queueQuery } from "../../../xano/api/queue.js";
import { underwritersQuery } from "../../../xano/api/underwriters.js";
import { getSubmissionQuery } from "../../../xano/api/submission-get.js";
import { assignSubmissionQuery } from "../../../xano/api/assign.js";
import { decisionQuery } from "../../../xano/api/decision.js";
import { referSubmissionQuery } from "../../../xano/api/refer.js";

/**
 * The deployed Xano backend's base URL. Injected as `window.XANO_HOST` by
 * `xanots deploy <entry> --static <dir>`, or read from `VITE_XANO_HOST` in dev.
 */
export const XANO_HOST: string =
  (typeof window !== "undefined" && (window as { XANO_HOST?: string }).XANO_HOST) ||
  import.meta.env.VITE_XANO_HOST ||
  "";

// ── Types, straight off the defs ────────────────────────────────────────────
export type LoginBody = InferInput<typeof loginQuery>;
export type LoginResult = InferResponse<typeof loginQuery>;
export type Me = InferResponse<typeof meQuery>;
export type Submission = InferResponse<typeof createSubmissionQuery>;
export type QueueRow = InferResponse<typeof queueQuery>[number];
export type Underwriter = InferResponse<typeof underwritersQuery>[number];
export type SubmissionDetail = InferResponse<typeof getSubmissionQuery>;
export type DecisionEvent = SubmissionDetail["events"][number];
export type CreateSubmissionBody = InferInput<typeof createSubmissionQuery>;

export type Role = "underwriter" | "senior_underwriter" | "admin";
export type LineOfBusiness = "property" | "casualty" | "auto" | "marine";
export type Decision = "approved" | "declined";

// ── Transport ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function call<T>(
  path: string,
  verb: string,
  opts: { body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.token) headers["authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(XANO_HOST + path, {
    method: verb,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      if (text) message = text;
    }
    throw new ApiError(res.status, message);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

// ── Endpoints ─────────────────────────────────────────────────────────────
export function login(body: LoginBody) {
  return call<LoginResult>(loginQuery.getPath(), loginQuery.verb, { body });
}

export function fetchMe(token: string) {
  return call<Me>(meQuery.getPath(), meQuery.verb, { token });
}

export function listQueue(
  token: string,
  filters: { status?: string; line_of_business?: string } = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.line_of_business) params.set("line_of_business", filters.line_of_business);
  const qs = params.toString();
  return call<QueueRow[]>(queueQuery.getPath() + (qs ? `?${qs}` : ""), queueQuery.verb, { token });
}

export function listUnderwriters(token: string) {
  return call<Underwriter[]>(underwritersQuery.getPath(), underwritersQuery.verb, { token });
}

export function getSubmission(token: string, id: number) {
  return call<SubmissionDetail>(
    getSubmissionQuery.getPath({ params: { id } }),
    getSubmissionQuery.verb,
    { token },
  );
}

export function createSubmission(token: string, body: CreateSubmissionBody) {
  return call<Submission>(createSubmissionQuery.getPath(), createSubmissionQuery.verb, {
    token,
    body,
  });
}

export function assignSubmission(token: string, id: number, assigned_to: number) {
  return call<Submission>(
    assignSubmissionQuery.getPath({ params: { id } }),
    assignSubmissionQuery.verb,
    { token, body: { assigned_to } },
  );
}

export function decideSubmission(token: string, id: number, decision: Decision) {
  return call<Submission>(decisionQuery.getPath({ params: { id } }), decisionQuery.verb, {
    token,
    body: { decision },
  });
}

export function referSubmission(token: string, id: number) {
  return call<Submission>(
    referSubmissionQuery.getPath({ params: { id } }),
    referSubmissionQuery.verb,
    { token },
  );
}

// ── Seeded demo logins (public throwaway credentials on a disposable env) ────
export const DEMO_LOGINS: { label: string; note: string; email: string; password: string }[] = [
  {
    label: "Underwriter",
    note: "Low authority limit",
    email: "underwriter@example.com",
    password: "password123",
  },
  {
    label: "Senior underwriter",
    note: "High authority limit",
    email: "senior@example.com",
    password: "password123",
  },
  {
    label: "Admin",
    note: "Effectively unbounded",
    email: "admin@example.com",
    password: "password123",
  },
];
