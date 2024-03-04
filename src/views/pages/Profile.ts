import { html } from 'hono/html'
import { User } from '../../utils/types'

export default function Profile(user: User) {
  return html`
    <div>${user.handle}</div>
    <img src="${user.profile.avatarUrl}" />
    <div id="rank">
      <h1>Rank</h1>
      <h4>${user.rank.rankTitle}</h4>
    </div>
  `
}
