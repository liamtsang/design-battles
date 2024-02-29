import { HtmlEscapedString } from "https://deno.land/x/hono@v4.0.3/utils/html.ts";
import { html } from "https://deno.land/x/hono@v4.0.4/helper.ts";

export default function Layout({
  title,
  user,
  content,
}: {
  title: string;
  // Replace with User type
  user: string;
  content: HtmlEscapedString | Promise<HtmlEscapedString>;
}) {
  return html`
    <html>
      <head>
        <title>${title}</title>
        <script src="https://unpkg.com/htmx.org@1.9.10" integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC" crossorigin="anonymous"></script>
      </head>
      <body>
        <header>
          <a href="/">Home</a>
          <a href="/auth/oauth/signin">Sign In</a>
          <a href="/auth/oauth/signout">Sign Out</a>
          <a href="/matchmaker?c=web">Find Match</a>
          <p>${user}</p>
        </header>
        ${content}
      </body>
    </html>
  `;
}
