import { HtmlEscapedString } from "https://deno.land/x/hono@v4.0.3/utils/html.ts";
import { html } from 'https://deno.land/x/hono@v4.0.4/helper.ts'

export default function Layout({
  title,
  content,
}:{
  title: string,
  content: HtmlEscapedString | Promise<HtmlEscapedString>
}) {
  return html`
    <html>
      <head>
        <title>${title}</title>
        <script src="https://unpkg.com/htmx.org@1.9.10" integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC" crossorigin="anonymous"></script>
      </head>
      <body>
        <header>
          <a href="/auth/oauth/signin">Login</a>
          <a href="/matchmaker">Find Match</a>
        </header>
        ${content}
      </body>
    </html>
  `
}
