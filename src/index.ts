import { serve } from "@hono/node-server";
import assert from "assert";
import { Hono, type Context } from "hono";
import { hc } from "hono/client";
import { validator } from "hono/validator";

const app = new Hono().post(
  "/",
  async (c: Context<{}, string, { in: { query: { peek?: boolean } } }>, next) => {
    if (c.req.query("peek")) {
      console.log("middleware - parsed body:", await c.req.parseBody());
    }
    return next();
  },
  validator("form", value => {
    console.log("validator - value:", value);
    assert(!(value instanceof FormData), "Value has to be a Record, not FormData");
    return value;
  }),
  c => {
    return c.text("Hello Hono!");
  }
);

const port = 3000;
console.log(`Server is running on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

server.on("listening", async () => {
  const client = hc<typeof app>("http://localhost:3000");

  await client.index.$post({ form: { wrong: "wrong" }, query: { peek: "true" } });

  console.log("------------------------");

  await client.index.$post({ form: { correct: "correct" } });
});
