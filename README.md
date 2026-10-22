# CivicText

Website for CivicText, a Telegram grant-finding bot for small businesses and
community groups. Built with React 19, TypeScript, React Router and Vite.
The website links to the Telegram bot; grant matching happens in the Python
backend.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production bundle
```

Copy `.env.example` to `.env` and set `VITE_TELEGRAM_BOT_USERNAME` (without
the `@`) to enable the bot links. `VITE_BACKEND_URL` defaults to
`http://127.0.0.1:8000` for the local developer dashboard. Restart Vite after
changing environment values.

Run the backend separately by following [backend/README.md](./backend/README.md).

## Structure

```
src/
  index.css                      global tokens (colors, fonts), resets, .container
  App.tsx / App.module.css       page shell and routes
  data/
    grantTypes.ts                Grant shape + option labels (audiences, focus areas...)
    grants.ts                    SAMPLE grant listings (fictional), split in two parts
    stories.ts                   SAMPLE success stories (fictional composites)
  lib/
    grantSearch.ts               pure filter/rank logic + URL param (de)serialisation
    platform.ts                  Telegram bot URL and backend configuration
  pages/
    Home.tsx                     landing page (Hero + HowItWorks)
    Demo.tsx                     Telegram bot entry point and privacy notes
    Grants.tsx                   local filters over fictional sample listings
    Stories.tsx                  fictional community scenarios
    Dashboard.tsx                local-only live Telegram request monitor
    NotFound.tsx                 branded 404 page for unknown URLs
  components/
    grants/GrantFilters.tsx      "Your background" filter panel
    grants/GrantCard.tsx         one grant result with match highlights
    Navbar.tsx                   sticky header, mobile hamburger menu
    Hero.tsx                     headline, Telegram CTA, project example
    HowItWorks.tsx               three-step section
    BotanicalDecor.tsx           decorative corner leaf SVGs
    Footer.tsx
```

## Customising

- Colors and fonts live as CSS variables at the top of `src/index.css`.
- Set the Telegram bot username in `.env` to enable the Telegram links.
- The hero photo is an Unsplash URL in `Hero.tsx`; swap it for a local image in
  `public/` for production.
- Fonts (Fraunces + Inter) load from Google Fonts in `index.html`.

## Telegram bot

`/demo` explains how to use the bot and links directly to Telegram when
`VITE_TELEGRAM_BOT_USERNAME` is configured. The Telegram bot processes the
message through the backend, which understands the request, searches its
current catalog, and sends grant details back through Telegram. The website
does not simulate a chat or generate application drafts.

Messages are sent to the backend and to Google Gemini for request
understanding. Users should not include sensitive personal information and
should verify eligibility and deadlines with each funder.

## Grants Database

`/grants` is a client-side UI preview over fictional sample data; it is not
connected to the backend grant database. Filters:

- Who you are (multi-select): Black-owned, women-led, youth-serving, faith-based,
  immigrant-led, veteran-owned, LGBTQ+-led, rural, first-time applicant,
  formerly incarcerated founders.
- What you are: business, nonprofit, informal group, individual.
- Focus area (multi-select), state, grant size, keyword search, sort.

Matching rules live in `src/lib/grantSearch.ts`. A grant must satisfy every
hard filter (org type, state, size, keyword) and at least one selected
audience and focus area. Results are then ranked by how many selected
audiences and focus areas they match, with local grants ahead of nationwide
ones. Expired deadlines are hidden automatically.

Filters are stored in the URL (`/grants?who=black-owned,youth&state=GA`), so a
search can be bookmarked or shared.

The listings in `src/data/grants*.ts` are fictional sample data, separate from
the backend catalog.

## Stories

`/stories` shows fictional community scenarios. The page labels them as
illustrations, not customer testimonials or verified grant awards.

## Local request monitor

In Vite development mode, `/dashboard` connects to a localhost backend's
`/stream` endpoint and displays incoming Telegram message text and chat IDs.
The current stream is unauthenticated, so the monitor is disabled for
production builds and non-local backend URLs. Do not expose the stream
publicly until backend authentication is implemented.

## Deploying

This is a single-page app, so the host must serve `index.html` for every path
or the 404 page will never render on a direct visit. Netlify and Vercel do this
automatically for Vite projects. For GitHub Pages, copy `dist/index.html` to
`dist/404.html` after building.
