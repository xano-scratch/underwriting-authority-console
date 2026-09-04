import { workspace } from "@xanots/sdk";

import { users } from "./tables/users.js";
import { submissions } from "./tables/submissions.js";
import { decisionEvents } from "./tables/decision-events.js";

import { authApi, uwApi } from "./api/groups.js";

import { loginQuery } from "./api/login.js";
import { meQuery } from "./api/me.js";
import { createSubmissionQuery } from "./api/submissions-create.js";
import { queueQuery } from "./api/queue.js";
import { underwritersQuery } from "./api/underwriters.js";
import { getSubmissionQuery } from "./api/submission-get.js";
import { assignSubmissionQuery } from "./api/assign.js";
import { decisionQuery } from "./api/decision.js";
import { referSubmissionQuery } from "./api/refer.js";

/**
 * The Underwriting Authority Console backend.
 *
 * A governed underwriting-ops backend (Play 3, Pilot to Production; insurance).
 * Submissions are queued, assigned by a senior, and decisioned only within each
 * underwriter's authority limit. An over-limit decision is refused at the API
 * layer and referred to senior review, whatever the frontend sends, and every
 * action is written to an append-only audit trail.
 *
 * Auth is native API-layer RBAC: a `users` auth table + `create_auth_token` +
 * per-endpoint `s.precondition` role and authority guards. No add-ons, no
 * row-level security.
 */
export default workspace("underwriting-authority-console")
  .registerTables([users, submissions, decisionEvents])
  .registerApiGroups([authApi, uwApi])
  .registerQueries([
    loginQuery,
    meQuery,
    createSubmissionQuery,
    queueQuery,
    underwritersQuery,
    getSubmissionQuery,
    assignSubmissionQuery,
    decisionQuery,
    referSubmissionQuery,
  ]);
