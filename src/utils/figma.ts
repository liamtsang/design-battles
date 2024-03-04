export async function figmaAPI(
  method: 'GET' | 'POST',
  route: string,
  access_token: string,
  params?: object
) {
  const r = await fetch(`https://api.figma.com/v1/${route}`, {
    method: method,
    headers: { Authorization: `Bearer ${access_token}` }
  })
  return await r.json()
}
