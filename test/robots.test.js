import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateRobots, parseRobots } from '../site/robots.js'

const bot = token => ({ token })

test('specific group overrides wildcard group', () => {
  const parsed = parseRobots(`User-agent: *\nDisallow: /private/\n\nUser-agent: Googlebot\nAllow: /`)
  assert.equal(evaluateRobots(parsed, 'https://example.com/private/x', bot('Googlebot')).allowed, true)
  assert.equal(evaluateRobots(parsed, 'https://example.com/private/x', bot('GPTBot')).allowed, false)
})

test('longest matching rule wins', () => {
  const parsed = parseRobots(`User-agent: *\nDisallow: /shop/\nAllow: /shop/public/`)
  const result = evaluateRobots(parsed, 'https://example.com/shop/public/a', bot('Googlebot'))
  assert.equal(result.allowed, true)
  assert.equal(result.matchedRule.raw, 'Allow: /shop/public/')
})

test('wildcards and end anchors are supported', () => {
  const parsed = parseRobots(`User-agent: *\nDisallow: /*?preview=*\nAllow: /products/*?preview=false$`)
  assert.equal(evaluateRobots(parsed, 'https://example.com/a?preview=1', bot('GPTBot')).allowed, false)
  assert.equal(evaluateRobots(parsed, 'https://example.com/products/a?preview=false', bot('GPTBot')).allowed, true)
})

test('Applebot can use Googlebot fallback when explicitly present', () => {
  const parsed = parseRobots(`User-agent: *\nAllow: /\nUser-agent: Googlebot\nDisallow: /private/`)
  const result = evaluateRobots(parsed, 'https://example.com/private/a', { token: 'Applebot', fallbackToken: 'Googlebot' })
  assert.equal(result.allowed, false)
  assert.equal(result.usedFallback, true)
})
