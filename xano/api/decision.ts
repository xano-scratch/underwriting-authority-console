import { query, input, s, ref, inp, auth, c, expr, withFilters, fl } from "@xanots/sdk";
import { submissions } from "../tables/submissions.js";
import { decisionEvents } from "../tables/decision-events.js";
import { users } from "../tables/users.js";
import { uwApi } from "./groups.js";

/**
 * POST /api:uw/submissions/{id}/decision — the core governed rule.
 *
 * The server checks the CALLER'S authority limit against the submission's
 * bound sum, not the frontend:
 *   - bound_sum <= authority_limit → the decision stands (`decisioned`).
 *   - bound_sum >  authority_limit → the attempt is REFUSED with 403
 *     `accessdenied`, the submission is set `referred`, and a `referred` audit
 *     event is written first, so the over-limit attempt is auditable, not
 *     silently dropped. The writes land before the guard throws, so the referral
 *     and its audit row persist even though the request returns a 4xx.
 *
 * Any authenticated role may attempt a decision; the authority limit is what
 * actually gates it.
 */
export const decisionQuery = query({
  name: "submissions/{id}/decision",
  verb: "POST",
  apiGroup: uwApi,
  auth: users,
  input: {
    id: input.int(),
    decision: input.enum(["approved", "declined"], { required: true }),
  },
  stack: [
    s.db.get_by_id({ table: users, id: auth("id"), as: "caller" }),
    s.db.get_by_id({ table: submissions, id: inp("id"), as: "sub" }),
    s.precondition({
      expr: expr(ref("sub", { safe: true }), "!=", c.null()),
      error_type: "notfound",
      error: c.text("Submission not found."),
    }),
    s.precondition({
      expr: expr(ref("sub.status"), "!=", c.text("decisioned")),
      error_type: "badrequest",
      error: c.text("This submission has already been decisioned."),
    }),
    s.conditional({
      when: expr(ref("sub.bound_sum"), "<=", ref("caller.authority_limit")),
      then: [
        s.db.edit({
          table: submissions,
          fieldName: "id",
          fieldValue: inp("id"),
          row: {
            status: "decisioned",
            decision: inp("decision"),
            decisioned_by: ref("caller.id"),
          },
        }),
        s.db.add({
          table: decisionEvents,
          row: {
            submission: inp("id"),
            actor: ref("caller.id"),
            action: "decisioned",
            detail: withFilters(
              c.text(""),
              fl.concat(inp("decision")),
              fl.concat(c.text(", bound ")),
              fl.concat(ref("sub.bound_sum")),
              fl.concat(c.text(" within limit ")),
              fl.concat(ref("caller.authority_limit")),
            ),
            at: c.now(),
          },
        }),
      ],
      else: [
        s.db.edit({
          table: submissions,
          fieldName: "id",
          fieldValue: inp("id"),
          row: { status: "referred" },
        }),
        s.db.add({
          table: decisionEvents,
          row: {
            submission: inp("id"),
            actor: ref("caller.id"),
            action: "referred",
            detail: withFilters(
              c.text("Over authority: bound "),
              fl.concat(ref("sub.bound_sum")),
              fl.concat(c.text(" exceeds limit ")),
              fl.concat(ref("caller.authority_limit")),
              fl.concat(c.text(", referred to senior review")),
            ),
            at: c.now(),
          },
        }),
        s.precondition({
          expr: expr(ref("sub.bound_sum"), "<=", ref("caller.authority_limit")),
          error_type: "accessdenied",
          error: c.text(
            "Over authority: this decision exceeds your authority limit and has been referred to senior review.",
          ),
        }),
      ],
    }),
    s.db.get_by_id({ table: submissions, id: inp("id"), as: "result" }),
  ],
  response: ref("result"),
});
