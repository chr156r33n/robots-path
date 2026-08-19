import { useMemo, useState } from 'react'
import { bots } from './data/bots.js'
import { evaluateRobots, normaliseTarget, parseRobots } from './robots.js'

const EXAMPLE = `User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /
`

function statusLabel(result) {
  if (result.bot.kind === 'user-fetch-robots-exception' && !result.allowed) {
    return 'Requested block*'
  }

  return result.allowed ? 'Allowed' : 'Blocked'
}

function CapabilitySummary({ results }) {
  const items = [
    ['Google Search', 'googlebot'],
    ['Google AI Overviews', 'googlebot'],
    ['Google AI Mode', 'googlebot'],
    ['ChatGPT Search', 'oai-searchbot'],
    ['Claude Search', 'claude-searchbot'],
    ['Perplexity Search', 'perplexitybot'],
    ['OpenAI training', 'gptbot'],
    ['Anthropic training', 'claudebot'],
    ['Gemini training / grounding', 'google-extended'],
    ['Common Crawl / CCBot', 'ccbot']
  ]

  return (
    <section className="panel summary-panel">
      <div className="section-heading">
        <p className="eyebrow">Implication summary</p>
        <h2>What this robots.txt permits</h2>
      </div>

      <div className="summary-grid">
        {items.map(([label, id]) => {
          const match = results.find(r => r.bot.id === id)

          if (!match) return null

          return (
            <div className="summary-item" key={label}>
              <span
                className={`dot ${match.allowed ? 'allowed' : 'blocked'}`}
              />
              <span>{label}</span>
              <strong>
                {match.allowed ? 'Allowed' : 'Restricted'}
              </strong>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ResultCard({ result }) {
  const {
    bot,
    matchedRule,
    matchedAgent,
    usedFallback
  } = result

  return (
    <details
      className={`result-card ${
        result.allowed ? 'is-allowed' : 'is-blocked'
      }`}
    >
      <summary className="result-summary">
        <div className="result-topline">
          <div>
            <p className="operator">{bot.operator}</p>
            <h3>{bot.token}</h3>
          </div>

          <div className="result-actions">
            <span
              className={`badge ${
                result.allowed ? 'allowed' : 'blocked'
              }`}
            >
              {statusLabel(result)}
            </span>

            <span
              className="expand-icon"
              aria-hidden="true"
            >
              ⌄
            </span>
          </div>
        </div>

        <p className="products">
          {bot.products.join(' · ')}
        </p>
      </summary>

      <div className="result-detail">
        <p className="implication">
          {result.allowed ? bot.allowed : bot.blocked}
        </p>

        <dl className="rule-detail">
          <div>
            <dt>Matched group</dt>
            <dd>
              <code>
                User-agent: {matchedAgent}
              </code>
              {usedFallback ? ' (fallback)' : ''}
            </dd>
          </div>

          <div>
            <dt>Matched rule</dt>
            <dd>
              {matchedRule
                ? <code>{matchedRule.raw}</code>
                : 'No matching Allow/Disallow rule'}
            </dd>
          </div>
        </dl>

        {bot.note && (
          <p className="note">
            {bot.note}
          </p>
        )}

        <a
          className="source-link"
          href={bot.source}
          target="_blank"
          rel="noreferrer"
        >
          Provider documentation ↗
        </a>
      </div>
    </details>
  )
}

export default function App() {
  const [robotsText, setRobotsText] = useState(EXAMPLE)
  const [origin, setOrigin] = useState('https://example.com')
  const [targetsText, setTargetsText] = useState(
    'https://example.com/products/example'
  )
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')

  const parsed = useMemo(
    () => parseRobots(robotsText),
    [robotsText]
  )

  function analyse(event) {
    event.preventDefault()
    setError('')

    try {
      const lines = targetsText
        .split(/\r?\n/)
        .map(v => v.trim())
        .filter(Boolean)

      if (!lines.length) {
        throw new Error(
          'Add at least one URL or path to test.'
        )
      }

      const normalisedOrigin = origin.trim()
        ? new URL(origin.trim()).origin
        : ''

      const targets = lines.map(value =>
        normaliseTarget(value, normalisedOrigin)
      )

      setSubmitted(
        targets.map(url => ({
          url,
          results: bots.map(bot => ({
            bot,
            ...evaluateRobots(parsed, url, bot)
          }))
        }))
      )
    } catch (err) {
      setError(
        err.message ||
        'Unable to analyse those URLs.'
      )
      setSubmitted(null)
    }
  }

  return (
    <main>
      <header className="hero shell">
        <a
          className="brand"
          href="https://www.chris-green.net"
          target="_top"
          rel="noreferrer"
        >
          CHRIS GREEN
        </a>

        <p className="eyebrow">
          Search & AI crawler governance
        </p>

        <h1>Robots Path</h1>

        <p className="lede">
          Paste a robots.txt file, test one or more URLs,
          and see which major search and AI crawlers are
          allowed or blocked, plus what those rules may
          mean in practice.
        </p>
      </header>

      <div className="shell tool-layout">
        <form
          className="panel input-panel"
          onSubmit={analyse}
        >
          <div className="section-heading">
            <p className="eyebrow">
              1. Robots.txt
            </p>
            <h2>Paste the file</h2>
          </div>

          <textarea
            className="robots-input"
            value={robotsText}
            onChange={e =>
              setRobotsText(e.target.value)
            }
            spellCheck="false"
            aria-label="robots.txt content"
          />

          <div className="input-row">
            <label>
              <span>
                Site origin
                <small>
                  optional for full URLs
                </small>
              </span>

              <input
                value={origin}
                onChange={e =>
                  setOrigin(e.target.value)
                }
                placeholder="https://example.com"
              />
            </label>
          </div>

          <label>
            <span>
              2. URLs or paths to test
              <small>
                one per line
              </small>
            </span>

            <textarea
              className="targets-input"
              value={targetsText}
              onChange={e =>
                setTargetsText(e.target.value)
              }
              placeholder={
                '/products/example\nhttps://example.com/private/'
              }
            />
          </label>

          {error && (
            <p
              className="error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button type="submit">
            Analyse crawler access
          </button>

          <p className="privacy">
            Everything runs in your browser. Pasted
            robots.txt content and tested URLs are not
            sent to a server by this tool.
          </p>
        </form>

        <aside className="panel explainer">
          <p className="eyebrow">
            How to read this
          </p>

          <h2>Access is not one thing</h2>

          <p>
            A blocked search crawler can affect index
            visibility. A blocked training crawler can
            opt content out of future model-development
            crawling. A user-initiated fetcher is a
            different category again.
          </p>

          <p>
            The tool reports the robots.txt rule and
            then adds the documented product implication.
            Robots.txt is a request to compliant crawlers,
            not access control.
          </p>
        </aside>
      </div>

      {submitted?.map((entry, index) => (
        <section
          className="shell results"
          key={entry.url}
        >
          <div className="results-heading">
            <p className="eyebrow">
              {submitted.length > 1
                ? `URL ${index + 1}`
                : 'Results'}
            </p>

            <h2>{entry.url}</h2>
          </div>

          <CapabilitySummary
            results={entry.results}
          />

          <div className="result-grid">
            {entry.results.map(result => (
              <ResultCard
                key={result.bot.id}
                result={result}
              />
            ))}
          </div>
        </section>
      ))}

      <footer className="shell footer">
        <p>
          Built by{' '}
          <a
            href="https://www.chris-green.net"
            target="_top"
            rel="noreferrer"
          >
            Chris Green
          </a>
          . Crawler implications are maintained from
          provider documentation and should be treated
          as guidance rather than a guarantee of indexing,
          citation or model use.
        </p>
      </footer>
    </main>
  )
}
