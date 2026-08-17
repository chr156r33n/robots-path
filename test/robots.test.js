import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateRobots, parseRobots } from '../src/robots.js'

const bot = token => ({ token })

test('specific bot group takes precedence over wildcard group', () => {
  const parsed = parseRobots(`User-agent: *\nDisallow: /private\n\nUser-agent: GPTBot\nAllow: /`)
  assert.equal(evaluateRobots(parsed, 'https://example.com/private', bot('GPTBot')).allowed, true)
  assert.equal(evaluateRobots(parsed, 'https://example.com/private', bot('Googlebot')).allowed, false)
})

test('longer matching rule wins and allow wins equal specificity ties', () => {
  const parsed = parseRobots(`User-agent: *\nDisallow: /shop/\nAllow: /shop/public/`)
  assert.equal(evaluateRobots(parsed, 'https://example.com/shop/public/item', bot('Googlebot')).allowed, true)
  assert.equal(evaluateRobots(parsed, 'https://example.com/shop/private/item', bot('Googlebot')).allowed, false)
})

test('wildcards and end anchors work', () => {
  const parsed = parseRobots(`User-agent: *\nDisallow: /*?preview=true$`)
  assert.equal(evaluateRobots(parsed, 'https://example.com/a?preview=true', bot('Googlebot')).allowed, false)
  assert.equal(evaluateRobots(parsed, 'https://example.com/a?preview=true&x=1', bot('Googlebot')).allowed, true)
})

test('fallback token is used where configured', () => {
  const parsed = parseRobots(`User-agent: Googlebot\nDisallow: /blocked`)
  const result = evaluateRobots(parsed, 'https://example.com/blocked', { token: 'Applebot', fallbackToken: 'Googlebot' })
  assert.equal(result.allowed, false)
  assert.equal(result.usedFallback, true)
})
