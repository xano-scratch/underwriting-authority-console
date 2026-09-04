import { table, f, seedFile } from "@xanots/sdk";

/**
 * The auth table. Backs API-layer RBAC: every protected endpoint names this
 * table as `auth:` and reads the caller with `auth("id")`.
 *
 * `authority_limit` is the dollar bound-sum a user may decision up to. It is the
 * governed number the decision endpoint checks server-side — an underwriter has a
 * low limit, a senior a high one, an admin an effectively unbounded one.
 *
 * `id` + `created_at` are auto-injected.
 */
export const users = table({
  name: "users",
  auth: true,
  schema: {
    email: f.email({ required: true, methods: ["lower", "trim"] }),
    password: f.password({ required: true }),
    name: f.text({ required: true }),
    role: f.enum(["underwriter", "senior_underwriter", "admin"], { required: true }),
    authority_limit: f.int({ required: true }),
    active: f.bool({ default: true }),
  },
  index: [{ type: "unique", fields: [{ name: "email" }] }],
  seed: seedFile("./users.seed.json", import.meta.url),
});
