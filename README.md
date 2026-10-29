# RepoLens

RepoLens is a frontend-only React app for public GitHub repository and developer analytics. It calls `https://api.github.com` from the browser. There is no API server, database, or GitHub token in this project

## Setup

```bash
cd github-analyzer
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Optional: copy `.env.example` to `.env` and set `REACT_APP_SUPPORT_EMAIL` if the FAQ page should open a real mailbox. Leave it empty to keep the contact form from claiming a message was sent. Do not add a GitHub token. Create React App inlines every `REACT_APP_*` value into the browser bundle.

## Scripts

- `npm start` — development server
- `npm test` — Jest
- `npm run build` — production build in `build/`

## GitHub data

Search, trending discovery, repository pages, developer pages, languages, commit statistics, pull requests, issues, contributors, and public events use unauthenticated REST endpoints. Responses are cached in memory, in-flight requests are cancelled when you leave a page, and rate-limit responses are shown instead of replacement data.

The contribution calendar is not loaded. GitHub only exposes it through authenticated GraphQL, and this app does not send a token. Star history is drawn only when every stargazer timestamp for a small repository is returned.

## Blog

Published articles live in `src/data/blogSeed.js` and ship with the frontend. `/admin/blog` is a local Markdown editor: drafts stay in this browser, with preview plus JSON and Markdown import/export. Exporting a file does not publish it. Add the exported article to `blogSeed.js` and rebuild to put it on the public blog.

## Support

The FAQ page keeps accordion search and categories. Report a bug and request a feature open `mailto:` links when `REACT_APP_SUPPORT_EMAIL` is set. The page does not store messages.
