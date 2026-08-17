import { bots } from './data/bots.js'
import { evaluateRobots, normaliseTarget, parseRobots } from './robots.js'

const $ = id => document.getElementById(id)
const state = { origin: '', robotsUrl: '', mode: 'fetch' }

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))
}
function showError(message='') {
  $('error').hidden = !message
  $('error').textContent = message
}
function pill(allowed, caveat=false) {
  const cls = allowed ? 'ok' : caveat ? 'warn' : 'bad'
  const label = caveat ? 'Caveat' : allowed ? 'Allowed' : 'Blocked'
  return `<span class="pill ${cls}"><span class="dot"></span>${label}</span>`
}
function setMode(mode) {
  state.mode = mode
  $('fetch-tab').classList.toggle('active', mode === 'fetch')
  $('paste-tab').classList.toggle('active', mode === 'paste')
  $('fetch-row').hidden = mode !== 'fetch'
  $('source-line').hidden = mode !== 'fetch' || !state.robotsUrl
}

async function fetchRobots() {
  const input = $('site-input').value.trim()
  if (!input) return showError('Enter a website or robots.txt URL.')
  showError()
  $('fetch-btn').disabled = true
  $('fetch-btn').textContent = 'Fetching…'
  try {
    const res = await fetch(`/api/robots?url=${encodeURIComponent(input)}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Unable to fetch robots.txt')
    state.origin = data.origin
    state.robotsUrl = data.robotsUrl
    $('robots').value = data.text
    $('source-line').hidden = false
    $('source-line').innerHTML = `Loaded <a href="${escapeHtml(data.robotsUrl)}" target="_blank" rel="noreferrer">${escapeHtml(data.robotsUrl)}</a>`
    if ($('targets').value.trim() === '/') $('targets').value = `${data.origin}/`
  } catch (err) {
    showError(err.message)
  } finally {
    $('fetch-btn').disabled = false
    $('fetch-btn').textContent = 'Fetch'
  }
}

function renderAnalysis() {
  showError()
  try {
    const parsed = parseRobots($('robots').value)
    const raws = $('targets').value.split(/\r?\n|,/).map(v => v.trim()).filter(Boolean)
    if (!raws.length) throw new Error('Enter at least one URL to test.')
    const analyses = raws.map(raw => {
      const url = normaliseTarget(raw, state.origin || undefined)
      return { url, rows: bots.map(bot => ({ bot, result: evaluateRobots(parsed, url, bot) })) }
    })
    $('results').innerHTML = renderResults(analyses)
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (err) {
    showError(err.message)
  }
}

function renderResults(analyses) {
  const first = analyses[0]
  const headlineDefs = [
    ['Google Search','googlebot'], ['AI Overviews','googlebot'], ['AI Mode','googlebot'],
    ['ChatGPT Search','oai-searchbot'], ['Claude Search','claude-searchbot'], ['Perplexity','perplexitybot']
  ]
  const headline = headlineDefs.map(([label,id]) => {
    const row = first.rows.find(x => x.bot.id === id)
    return `<div class="summary-card"><span>${escapeHtml(label)}</span>${pill(row.result.allowed)}</div>`
  }).join('')

  const sections = analyses.map(target => {
    const cards = target.rows.map(({bot,result}) => {
      const caveat = !result.allowed && bot.kind === 'user-fetch-robots-exception'
      const decision = caveat ? 'Robots block · may still fetch' : result.allowed ? 'Allowed' : 'Blocked'
      return `<article class="bot-card">
        <div class="bot-top"><div><div class="operator">${escapeHtml(bot.operator)}</div><h3>${escapeHtml(bot.token)}</h3></div>${pill(result.allowed,caveat)}</div>
        <div class="tags"><span>${escapeHtml(bot.category)}</span>${bot.kind === 'control-token' ? '<span>Control token</span>' : ''}</div>
        <p class="implication">${escapeHtml(result.allowed ? bot.allowed : bot.blocked)}</p>
        <div class="rule-box">
          <div><span>Decision</span><strong>${escapeHtml(decision)}</strong></div>
          <div><span>Matched group</span><code>User-agent: ${escapeHtml(result.matchedAgent)}</code>${result.usedFallback ? '<small>Applebot fallback behaviour</small>' : ''}</div>
          <div><span>Matched rule</span><code>${escapeHtml(result.matchedRule?.raw || 'No matching Allow/Disallow rule')}</code></div>
        </div>
        ${bot.note ? `<p class="note">${escapeHtml(bot.note)}</p>` : ''}
        <a class="docs" href="${escapeHtml(bot.source)}" target="_blank" rel="noreferrer">Official documentation ↗</a>
      </article>`
    }).join('')
    return `<section class="results-section">${analyses.length > 1 ? `<h2 class="target-title">${escapeHtml(target.url)}</h2>` : ''}<div class="results-list">${cards}</div></section>`
  }).join('')

  return `<section class="summary-section"><div class="section-heading"><p class="eyebrow">AT A GLANCE</p><h2>${escapeHtml(first.url)}</h2></div><div class="summary-grid">${headline}</div></section>${sections}`
}

$('fetch-tab').addEventListener('click', () => setMode('fetch'))
$('paste-tab').addEventListener('click', () => setMode('paste'))
$('fetch-btn').addEventListener('click', fetchRobots)
$('site-input').addEventListener('keydown', e => { if (e.key === 'Enter') fetchRobots() })
$('analyse-btn').addEventListener('click', renderAnalysis)
setMode('fetch')
