import { query, input, s, ref, inp, auth, c, expr, or, withFilters, fl } from "@xanots/sdk";
import { submissions } from "../tables/submissions.js";
import { decisionEvents } from "../tables/decision-events.js";
import { users } from "../tables/users.js";
import { uwApi } from "./groups.js";

/**
 * POST /api:uw/submissions/{id}/assign — assign a submission to an underwriter.
 *
 * RBAC guard: only a senior underwriter or an admin may assign, enforced at the
 * API layer with `s.precondition` — whatever the frontend sends. Sets the
 * submission `assigned` and writes an `assigned` audit event.
 */
export const assignSubmissionQuery = query({
  name: "submissions/{id}/assign",
  verb: "POST",
  apiGroup: uwApi,
  auth: users,
  input: {
    id: input.int(),
    assigned_to: input.int({ required: true }),
  },
  stack: [
    s.db.get_by_id({ table: users, id: auth("id"), as: "caller" }),
    s.precondition({
      expr: or(
        expr(ref("caller.role"), "=", c.text("senior_underwriter")),
        expr(ref("caller.role"), "=", c.text("admin")),
      ),
      error_type: "accessdenied",
      error: c.text("Only a senior underwriter or an admin can assign submissions."),
    }),
    s.db.get_by_id({ table: submissions, id: inp("id"), as: "sub" }),
    s.precondition({
      expr: expr(ref("sub", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Submission not found."),
    }),
    s.db.get_by_id({ table: users, id: inp("assigned_to"), as: "assignee" }),
    s.precondition({
      expr: expr(ref("assignee", { safe: true }), "!=", c.null()),
      error_type: "badrequest",
      error: c.text("Assignee not found."),
    }),
    s.precondition({
      expr: expr(ref("assignee.active"), "=", c.bool(true)),
      error_type: "badrequest",
      error: c.text("Cannot assign to an inactive user."),
    }),
    s.db.edit({
      table: submissions,
      fieldName: "id",
      fieldValue: inp("id"),
      row: { status: "assigned", assigned_to: inp("assigned_to") },
      as: "updated",
    }),
    s.db.add({
      table: decisionEvents,
      row: {
        submission: inp("id"),
        actor: ref("caller.id"),
        action: "assigned",
        detail: withFilters(c.text("Assigned to "), fl.concat(ref("assignee.name"))),
        at: c.now(),
      },
    }),
  ],
  response: ref("updated"),
});
