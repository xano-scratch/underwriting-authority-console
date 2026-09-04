import { table, f, seedFile } from "@xanots/sdk";
import { users } from "./users.js";

/**
 * An underwriting submission moving through the queue.
 *
 * `bound_sum` is the coverage amount checked against the deciding underwriter's
 * authority limit. `status` is the workflow state; `assigned_to` / `decisioned_by`
 * are optional foreign keys, so they use the `0` sentinel (a null FK is
 * unqueryable — see fields.md) rather than `nullable: true`.
 *
 * `id` + `created_at` are auto-injected.
 */
export const submissions = table({
  name: "submissions",
  schema: {
    applicant_name: f.text({ required: true }),
    line_of_business: f.enum(["property", "casualty", "auto", "marine"], { required: true }),
    bound_sum: f.int({ required: true }),
    status: f.enum(["new", "assigned", "decisioned", "referred"], { default: "new" }),
    assigned_to: f.tableRef(users, { default: 0 }),
    decision: f.enum(["approved", "declined"], { nullable: true }),
    decisioned_by: f.tableRef(users, { default: 0 }),
  },
  index: [{ type: "btree", fields: [{ name: "status" }] }],
  seed: seedFile("./submissions.seed.json", import.meta.url),
});
