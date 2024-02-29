import { html } from "https://deno.land/x/hono@v4.0.4/helper.ts";
import { User } from "../../utils/types.ts";

export default function Profile(user: User) {
  return html`
    <div>${user.handle}</div>
    
    <img src="${user.profile.avatarUrl}" />
  `;
}
