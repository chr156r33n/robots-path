# Robots Path

A static React tool for testing pasted `robots.txt` rules against major search and AI crawler tokens, then explaining the likely product implications of allowing or blocking them.

## What it does

- Paste a `robots.txt` file into the browser.
- Test one or more full URLs, or paths when a site origin is supplied.
- Evaluate matching `Allow` and `Disallow` rules for major crawler/control tokens.
- Show the exact matching user-agent group and rule.
- Explain implications for Google Search, AI Overviews, AI Mode, ChatGPT Search, Claude, Perplexity, model-training crawlers and more.
- Runs entirely client-side. No pasted data is sent to a backend.

## Local development

```bash
npm install
npm run dev
```

Tests:

```bash
npm test
```

Production build:

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

This repository is configured for the project URL:

`https://chr156r33n.github.io/robots-path/`

`vite.config.js` therefore uses `base: '/robots-path/'`.

In GitHub, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. Every push to `main` will then test, build and deploy the `dist` directory.

If the repository name changes, update the `base` value in `vite.config.js`. If the app later moves to a custom domain, use `base: '/'` instead.

## Embedding

Once deployed, it can be embedded into another site with an iframe:

```html
<iframe
  src="https://chr156r33n.github.io/robots-path/"
  width="100%"
  height="1400"
  style="border:0"
  loading="lazy"
  title="Robots Path"
></iframe>
```

## Updating crawler knowledge

Crawler definitions and implications live in `src/data/bots.js`. Keep provider documentation URLs and `verified` dates current when changing them.

## Important caveat

This tool evaluates robots.txt instructions and documented crawler purposes. Robots.txt is not access control, and an allowed crawler does not guarantee indexing, citation, ranking, retrieval or model use.
