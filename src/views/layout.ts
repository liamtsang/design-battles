import { HtmlEscapedString } from 'hono/utils/html'
import { html } from 'hono/html'

export default function Layout({
  title,
  user,
  content
}: {
  title: string
  // Replace with User type
  user: string
  content: HtmlEscapedString | Promise<HtmlEscapedString>
}) {
  return html`
    <html>
      <head>
        <title>${title}</title>
        <script
          src="https://unpkg.com/htmx.org@1.9.10"
          integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC"
          crossorigin="anonymous"
        ></script>
        <script src="https://unpkg.com/htmx.org/dist/ext/sse.js"></script>
      </head>
      <body>
        <header>
          <a href="/">Home</a>
          <a href="/auth/oauth/signin">Sign In</a>
          <a href="/auth/oauth/signout">Sign Out</a>
          <a href="/matchmaker?c=web">Find Match</a>
          <div
            hx-ext="sse"
            sse-connect="/matchmaker/sse"
            sse-swap="time-update"
          >
            placeholder
          </div>
          <p>${user}</p>
        </header>
        ${content}
      </body>
    </html>
  `
}
