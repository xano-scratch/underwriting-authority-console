import { query, s, ref, col, c, cmp } from "@xanots/sdk";
import { users } from "../tables/users.js";
import { uwApi } from "./groups.js";

/**
 * GET /api:uw/underwriters — the active users a submission can be assigned to.
 *
 * Drives the assign picker on the queue screen. The password column is
 * `internal`, so it is never returned. Any authenticated role may read the list.
 */
export const underwritersQuery = query({
  name: "underwriters",
  verb: "GET",
  apiGroup: uwApi,
  auth: users,
  stack: [
    s.db.query({
      table: users,
      where: cmp(col("active"), "=", c.bool(true)),
      sort: [{ sortBy: "name", dir: "asc" }],
      output: ["id", "name", "role", "authority_limit"],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
