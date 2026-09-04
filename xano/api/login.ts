import { query, input, s, ref, inp, c, expr, obj } from "@xanots/sdk";
import { users } from "../tables/users.js";
import { authApi } from "./groups.js";

/**
 * POST /api:auth/login — email + password, returns an auth token.
 *
 * The password is taken as `input.text` (NOT `input.password`, which would hash
 * the submission a second time and never match). `output` names `password`
 * because the column is `access: "internal"` and absent from a plain read.
 */
export const loginQuery = query({
  name: "login",
  verb: "POST",
  apiGroup: authApi,
  input: {
    email: input.text({ required: true, methods: ["lower", "trim"] }),
    password: input.text({ required: true }),
  },
  stack: [
    s.db.get({
      table: users,
      fieldName: "email",
      fieldValue: inp("email"),
      output: ["id", "email", "name", "role", "authority_limit", "active", "password"],
      as: "u",
    }),
    s.precondition({
      expr: expr(ref("u", { safe: true }), "!=", c.null()),
      error_type: "unauthorized",
      error: c.text("Wrong email or password."),
    }),
    s.precondition({
      expr: expr(ref("u.active"), "=", c.bool(true)),
      error_type: "accessdenied",
      error: c.text("This account is inactive."),
    }),
    s.security.check_password({
      text_password: inp("password"),
      hash_password: ref("u.password"),
      as: "ok",
    }),
    s.precondition({
      expr: expr(ref("ok"), "=", c.bool(true)),
      error_type: "unauthorized",
      error: c.text("Wrong email or password."),
    }),
    s.security.create_auth_token({ table: users, id: ref("u.id"), as: "token" }),
  ],
  response: {
    token: ref("token"),
    user: obj({
      id: ref("u.id"),
      name: ref("u.name"),
      role: ref("u.role"),
      authority_limit: ref("u.authority_limit"),
    }),
  },
});
