# AI & Search Robots.txt Tester

A branded web app for testing robots.txt rules against major search and AI crawler/control tokens, with plain-English implications.

## Features

- Fetch a live `/robots.txt` through a Cloudflare Pages Function, avoiding browser CORS limitations.
- Paste robots.txt content to test proposed or staging rules.
- Test one URL or a batch of URLs.
- Show the matching user-agent group and exact Allow/Disallow rule behind each result.
- Separate search crawling, AI search/retrieval, model-development controls and user-initiated fetchers.
- Explicitly explain Google Search, AI Overviews and AI Mode implications.
- Keep crawler/product knowledge in `site/data/bots.js`, separate from parser logic.

## Local tests/build

No application dependencies are required.

```bash
npm test
npm run build
```

To run the full app including the `/api/robots` Pages Function, use Cloudflare Wrangler:

```bash
npm run build
npx wrangler pages dev dist
```

## Deploy with GitHub Actions

The included workflow deploys every push to `main` to a Cloudflare Pages project named `robots-ai-tester`.

Add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Create/attach a Cloudflare Pages custom domain such as `robots.chris-green.net`.

## Embed on Chris-Green.net

```html
<iframe
  src="https://robots.chris-green.net"
  title="AI & Search Robots.txt Tester"
  width="100%"
  height="1200"
  style="border:0;width:100%;"
  loading="lazy">
</iframe>
```

`site/_headers` restricts framing to `chris-green.net` and `www.chris-green.net`. Add any staging/editor domains before embedding there.

## Maintaining crawler definitions

Definitions live in `site/data/bots.js`. Each contains the robots token, operator, category, affected products, allow/block implications, official source, review date, and caveats.

## Important limitation

Robots.txt is a crawler preference mechanism, not access control. An Allowed result does not guarantee indexing, ranking, citation, retrieval or model usage. A Blocked result means the tested rules request that the named crawler/token not access/use that URL according to the provider's documented behaviour.
