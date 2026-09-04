import { query, input, s, ref, inp, auth, c } from "@xanots/sdk";
import { submissions } from "../tables/submissions.js";
import { decisionEvents } from "../tables/decision-events.js";
import { users } from "../tables/users.js";
import { uwApi } from "./groups.js";

/**
 * POST /api:uw/submissions — create a submission in the `new` state.
 *
 * Any authenticated role may file one. Writes a `created` audit event.
 */
export const createSubmissionQuery = query({
  name: "submissions",
  verb: "POST",
  apiGroup: uwApi,
  auth: users,
  input: {
    applicant_name: input.text({ required: true }),
    line_of_business: input.enum(["property", "casualty", "auto", "marine"], { required: true }),
    bound_sum: input.int({ required: true }),
  },
  stack: [
    s.db.add({
      table: submissions,
      row: {
        applicant_name: inp("applicant_name"),
        line_of_business: inp("line_of_business"),
        bound_sum: inp("bound_sum"),
        status: "new",
      },
      as: "sub",
    }),
    s.db.add({
      table: decisionEvents,
      row: {
        submission: ref("sub.id"),
        actor: auth("id"),
        action: "created",
        detail: c.text("Submission created"),
        at: c.now(),
      },
    }),
  ],
  response: ref("sub"),
});
