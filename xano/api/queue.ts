import { query, input, s, ref, inp, col, cmp } from "@xanots/sdk";
import { submissions } from "../tables/submissions.js";
import { users } from "../tables/users.js";
import { uwApi } from "./groups.js";

/**
 * GET /api:uw/queue — the submissions list, newest first.
 *
 * `status` and `line_of_business` are OPTIONAL filters: `ignoreEmpty` drops the
 * predicate when the operand is empty, so an unset filter returns every row and a
 * set one narrows. Any authenticated role may read the queue.
 */
export const queueQuery = query({
  name: "queue",
  verb: "GET",
  apiGroup: uwApi,
  auth: users,
  input: {
    status: input.enum(["new", "assigned", "decisioned", "referred"], { required: false }),
    line_of_business: input.enum(["property", "casualty", "auto", "marine"], { required: false }),
  },
  stack: [
    s.db.query({
      table: submissions,
      where: [
        cmp(col("status"), "=", inp("status"), { ignoreEmpty: true }),
        cmp(col("line_of_business"), "=", inp("line_of_business"), { ignoreEmpty: true }),
      ],
      sort: [{ sortBy: "created_at", dir: "desc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
