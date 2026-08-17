function stripComment(line) {
  const hash = line.indexOf('#')
  return (hash >= 0 ? line.slice(0, hash) : line).trim()
}

export function parseRobots(text) {
  const groups = []
  const sitemaps = []
  let currentAgents = []
  let currentRules = []
  let hasDirective = false

  const flush = () => {
    if (currentAgents.length) {
      groups.push({ agents: [...currentAgents], rules: [...currentRules] })
    }
    currentAgents = []
    currentRules = []
    hasDirective = false
  }

  for (const raw of String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = stripComment(raw)
    if (!line) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const field = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()

    if (field === 'user-agent') {
      if (hasDirective) flush()
      currentAgents.push(value.toLowerCase())
      continue
    }

    if (field === 'sitemap') {
      if (value) sitemaps.push(value)
      continue
    }

    if ((field === 'allow' || field === 'disallow') && currentAgents.length) {
      currentRules.push({ type: field, pattern: value, raw: `${field[0].toUpperCase()}${field.slice(1)}: ${value}` })
      hasDirective = true
    }
  }
  flush()
  return { groups, sitemaps }
}

function hasSpecificGroup(parsed, token) {
  const t = token.toLowerCase()
  return parsed.groups.some(g => g.agents.some(a => a !== '*' && a === t))
}

function selectedGroups(parsed, token, fallbackToken) {
  const t = token.toLowerCase()
  const specific = parsed.groups.filter(g => g.agents.some(a => a !== '*' && a === t))
  if (specific.length) return { groups: specific, matchedAgent: token }

  if (fallbackToken && hasSpecificGroup(parsed, fallbackToken)) {
    const f = fallbackToken.toLowerCase()
    return {
      groups: parsed.groups.filter(g => g.agents.some(a => a !== '*' && a === f)),
      matchedAgent: fallbackToken,
      fallback: true
    }
  }

  return {
    groups: parsed.groups.filter(g => g.agents.includes('*')),
    matchedAgent: '*'
  }
}

function escapeRegexChar(c) {
  return /[\\^$+?.()|{}\[\]]/.test(c) ? `\\${c}` : c
}

function ruleRegex(pattern) {
  let p = pattern
  let anchored = false
  if (p.endsWith('$')) {
    anchored = true
    p = p.slice(0, -1)
  }
  let out = '^'
  for (const c of p) out += c === '*' ? '.*' : escapeRegexChar(c)
  if (anchored) out += '$'
  return new RegExp(out)
}

function specificity(pattern) {
  return pattern.replace(/\*/g, '').replace(/\$$/, '').length
}

function pathForRobots(url) {
  const u = new URL(url)
  return `${u.pathname || '/'}${u.search || ''}`
}

export function evaluateRobots(parsed, url, bot) {
  const path = pathForRobots(url)
  const selected = selectedGroups(parsed, bot.token, bot.fallbackToken)
  const candidates = []

  for (const group of selected.groups) {
    for (const rule of group.rules) {
      if (rule.type === 'disallow' && rule.pattern === '') continue
      if (rule.pattern === '') continue
      try {
        if (ruleRegex(rule.pattern).test(path)) {
          candidates.push({ ...rule, score: specificity(rule.pattern) })
        }
      } catch {
        // Ignore malformed patterns rather than turning the whole audit into theatre.
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || (a.type === 'allow' ? -1 : 1))
  const matchedRule = candidates[0] || null
  const allowed = !matchedRule || matchedRule.type === 'allow'

  return {
    allowed,
    path,
    matchedRule,
    matchedAgent: selected.matchedAgent,
    usedFallback: !!selected.fallback,
    hasSpecificGroup: hasSpecificGroup(parsed, bot.token),
    groupsConsidered: selected.groups.length
  }
}

export function normaliseTarget(input, origin) {
  const trimmed = String(input || '').trim()
  if (!trimmed) throw new Error('Enter a URL to test.')
  if (/^https?:\/\//i.test(trimmed)) return new URL(trimmed).href
  if (!origin) throw new Error('Use a full URL, or fetch robots.txt from a site first.')
  return new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, origin).href
}
