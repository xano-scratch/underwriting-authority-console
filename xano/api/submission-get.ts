import { query, input, s, ref, inp, col, c, expr } from "@xanots/sdk";
import { submissions } from "../tables/submissions.js";
import { decisionEvents } from "../tables/decision-events.js";
import { users } from "../tables/users.js";
import { uwApi } from "./groups.js";

/**
 * GET /api:uw/submissions/{id} — one submission joined with its full, ordered
 * audit trail. Powers the detail + audit view. Any authenticated role may read.
 *
 * The trail joins each event's `actor` to the users table so the UI can show who
 * acted, projecting the actor's name with an `eval` (a joined column is not on the
 * returned row otherwise).
 */
export const getSubmissionQuery = query({
  name: "submissions/{id}",
  verb: "GET",
  apiGroup: uwApi,
  auth: users,
  input: { id: input.int() },
  stack: [
    s.db.get_by_id({ table: submissions, id: inp("id"), as: "sub" }),
    s.precondition({
      expr: expr(ref("sub", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Submission not found."),
    }),
    s.db.query({
      table: decisionEvents,
      where: expr(col("submission"), "=", inp("id")),
      bind: [
        {
          table: users,
          as: "actor_row",
          join: "left",
          where: expr(col("actor"), "=", col("actor_row.id")),
        },
      ],
      eval: [{ name: "actor_row.name", as: "actor_name" }],
      sort: [{ sortBy: "at", dir: "asc" }],
      as: "events",
    }),
  ],
  response: { submission: ref("sub"), events: ref("events") },
});
