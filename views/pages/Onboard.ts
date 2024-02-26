import { html } from "https://deno.land/x/hono@v4.0.4/helper.ts";

export default function Onboard() {
  return html`
    <form hx-post "/auth/onboard">
      <div hx-target="this" hx-swap="outerHTML">
        <label>Username</label>
        <input name="username" hx-post="/auth/username-exists" hx-indicator="#ind">
        <button disabled class="btn btn-default" type="submit">Submit</button>
      </div>
    </form>
  `;
}
