import { apiGroup } from "@xanots/sdk";

/**
 * Two API groups with PINNED canonical slugs, so the public paths are stable and
 * `getPath()` resolves in the browser bundle without a lock file.
 *
 *   auth  → /api:auth/...   login + identity
 *   uw    → /api:uw/...     the governed underwriting endpoints
 */
export const authApi = apiGroup({ name: "auth", canonical: "auth" });

export const uwApi = apiGroup({ name: "uw", canonical: "uw" });
