import { query, input, s, ref, inp, auth, c, expr } from "@xanots/sdk";
import { submissions } from "../tables/submissions.js";
import { decisionEvents } from "../tables/decision-events.js";
import { users } from "../tables/users.js";
import { uwApi } from "./groups.js";

/**
 * POST /api:uw/submissions/{id}/refer — explicitly refer a submission to senior
 * review. Any authenticated role may refer. Writes a `referred` audit event.
 */
export const referSubmissionQuery = query({
  name: "submissions/{id}/refer",
  verb: "POST",
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
    s.db.edit({
      table: submissions,
      fieldName: "id",
      fieldValue: inp("id"),
      row: { status: "referred" },
      as: "updated",
    }),
    s.db.add({
      table: decisionEvents,
      row: {
        submission: inp("id"),
        actor: auth("id"),
        action: "referred",
        detail: c.text("Referred to senior review."),
        at: c.now(),
      },
    }),
  ],
  response: ref("updated"),
});
