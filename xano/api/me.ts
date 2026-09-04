import { query, s, auth, ref } from "@xanots/sdk";
import { users } from "../tables/users.js";
import { authApi } from "./groups.js";

/**
 * GET /api:auth/me — the caller's identity, role, and authority limit.
 *
 * `auth: users` refuses any request without a valid bearer token before the
 * stack runs, so `auth("id")` is always the caller's own row id. The password
 * column is `internal`, so it is never in the returned row.
 */
export const meQuery = query({
  name: "me",
  verb: "GET",
  apiGroup: authApi,
  auth: users,
  stack: [
    s.db.get_by_id({ table: users, id: auth("id"), as: "caller" }),
  ],
  response: {
    id: ref("caller.id"),
    email: ref("caller.email"),
    name: ref("caller.name"),
    role: ref("caller.role"),
    authority_limit: ref("caller.authority_limit"),
    active: ref("caller.active"),
  },
});
