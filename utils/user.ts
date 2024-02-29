import { Context } from "https://deno.land/x/hono@v4.0.7/mod.ts";
import { getCookie } from "https://deno.land/x/hono@v4.0.7/helper.ts";
import { HTTPException } from "https://deno.land/x/hono@v4.0.7/http-exception.ts";
import { User } from "./types.ts";

const kv = await Deno.openKv();

export async function getUser(c: Context): Promise<[string, unknown]> {
  const id = getCookie(c, "id") as string;
  const user = await kv.get(["user", id]);
  if (!user.value) {
    throw new HTTPException(401, {
      message: "User does not exist or you are not logged in.",
    });
  }
  return [id, user.value];
}
