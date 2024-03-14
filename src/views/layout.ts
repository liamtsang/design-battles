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
        <script src="https://unpkg.com/htmx.org/dist/ext/ws.js"></script>
        <script>
          // Await loading
          window.onload = function () {
            //
            document.body.addEventListener('htmx:wsClose', function () {
              htmx.ajax('GET', '/durableHTMX/queue', {
                target: '#queueTimerWrapper',
                swap: 'outerHTML'
              })
            })
            document.body.addEventListener('htmx:wsOpen', function (evt) {
              console.log(evt.detail)
              const timer = document.getElementById('queueTimer')
              const start = Date.now()
              const clientInterval = setInterval(function () {
                let d = Date.now() - start
                let delta = new Date(d)
                let minutes = delta.getMinutes()
                let seconds = delta.getSeconds()
                if (minutes < 10) {
                  minutes = '0' + minutes
                }
                if (seconds < 10) {
                  seconds = '0' + seconds
                }
                timer.innerHTML = minutes + ' : ' + seconds
              }, 1000)
            })
          }
        </script>
      </head>
      <body>
        <header>
          <a href="/">Home</a>
          <a href="/auth/oauth/signin">Sign In</a>
          <a href="/auth/oauth/signout">Sign Out</a>
          <a href="/matchmaker">Find Match</a>
          <button
            hx-trigger="click"
            hx-get="/matchmaker/button"
            hx-swap="outerHTML"
          >
            Find Match
          </button>
          <p>${user}</p>
        </header>
        ${content}
      </body>
    </html>
  `
}
