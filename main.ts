import { Context, Hono } from "https://deno.land/x/hono@v4.0.3/mod.ts";
import { HTTPException } from "https://deno.land/x/hono@v4.0.3/http-exception.ts";
import {
  getCookie,
  setCookie,
} from "https://deno.land/x/hono@v4.0.3/helper.ts";
import { logger } from "https://deno.land/x/hono@v4.0.7/middleware.ts";
import Layout from "./views/layout.ts";
import Landing from "./views/pages/Landing.ts";
import matchmaker from "./routes/matchmaker.ts";
import match from "./routes/match.ts";
import auth from "./routes/auth.ts";
import user from "./routes/user.ts";

const app = new Hono();

app.use(logger());

app.route("/matchmaker", matchmaker);
app.route("/match", match);
app.route("/auth", auth);
app.route("/user", user);

app.get("/", (c: Context) => {
  if (getCookie(c, "requires-onboarding") !== undefined) {
    return c.redirect("/auth/onboard");
  }
  const uidCookie: string = getCookie(c, "internal-uid")!;
  return c.html(Layout({ title: "Home", user: uidCookie, content: Landing() }));
});

app.notFound((c: Context) => {
  return c.text("Aw shucks, 404", 404);
});

app.onError((err: HTTPException, c: Context) => {
  switch (err.status) {
    case 401: {
      return c.text("Not allowed, 401 >:(\n" + "Message: " + err.message);
    }
  }
});

Deno.serve(app.fetch);
