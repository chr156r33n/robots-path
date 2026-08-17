const MAX_BYTES = 1024 * 1024

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  })
}

function deriveRobotsUrl(value) {
  let raw = String(value || '').trim()
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
  const input = new URL(raw)
  if (!['http:', 'https:'].includes(input.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.')
  return {
    origin: input.origin,
    robotsUrl: new URL('/robots.txt', input.origin).href
  }
}

export async function onRequestGet({ request }) {
  try {
    const requestUrl = new URL(request.url)
    const value = requestUrl.searchParams.get('url')
    if (!value) return json({ error: 'Add a website or robots.txt URL.' }, 400)
    const { origin, robotsUrl } = deriveRobotsUrl(value)

    const upstream = await fetch(robotsUrl, {
      redirect: 'follow',
      headers: {
        'user-agent': 'ChrisGreen-RobotsTester/0.1 (+https://www.chris-green.net/)'
      },
      cf: { cacheTtl: 0, cacheEverything: false }
    })

    if (!upstream.ok) {
      return json({ error: `robots.txt returned HTTP ${upstream.status}.`, origin, robotsUrl }, 502)
    }

    const len = Number(upstream.headers.get('content-length') || 0)
    if (len > MAX_BYTES) return json({ error: 'robots.txt is larger than the 1 MB safety limit.' }, 413)

    const text = await upstream.text()
    if (new TextEncoder().encode(text).byteLength > MAX_BYTES) return json({ error: 'robots.txt is larger than the 1 MB safety limit.' }, 413)

    return json({ origin, robotsUrl, text })
  } catch (e) {
    return json({ error: e.message || 'Unable to fetch robots.txt.' }, 400)
  }
}
