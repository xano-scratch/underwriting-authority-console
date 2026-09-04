import { table, f, seedFile } from "@xanots/sdk";
import { users } from "./users.js";
import { submissions } from "./submissions.js";

/**
 * The append-only audit trail. Every mutating endpoint writes one row here and
 * nothing ever updates or deletes them, so the trail is the governance record: it
 * shows who did what, when, and — in `detail` — the exact numbers behind an
 * authority decision or a referral.
 *
 * `id` + `created_at` are auto-injected; `at` is the caller-visible event time.
 */
export const decisionEvents = table({
  name: "decision_events",
  schema: {
    submission: f.tableRef(submissions, { required: true }),
    actor: f.tableRef(users, { required: true }),
    action: f.enum(["created", "assigned", "decisioned", "referred"], { required: true }),
    detail: f.text({ required: true }),
    at: f.timestamp({ required: true }),
  },
  index: [{ type: "btree", fields: [{ name: "submission" }] }],
  seed: seedFile("./decision-events.seed.json", import.meta.url),
});
