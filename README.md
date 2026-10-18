# CivicText landing page

Landing page for CivicText, an SMS grant finder for grassroots organizers.
Built with React 19, TypeScript, React Router and Vite. Styling is plain CSS
with CSS Modules; no UI framework.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production bundle
```

## Structure

```
src/
  index.css                      global tokens (colors, fonts), resets, .container
  App.tsx / App.module.css       page shell, AuthProvider and routes
  auth/
    types.ts                     User + AuthService interface (the swap point)
    mockAuthService.ts           localStorage-backed mock backend (dev only)
    AuthProvider.tsx             holds session state, exposes sign in/up/out
    useAuth.ts                   hook for components
    validation.ts                email/password/name checks + strength meter
  data/
    grantTypes.ts                Grant shape + option labels (audiences, focus areas...)
    grants.ts                    SAMPLE grant listings (fictional), split in two parts
    stories.ts                   SAMPLE success stories (fictional composites)
  lib/
    grantSearch.ts               pure filter/rank logic + URL param (de)serialisation
    intent.ts / intentKeywords.ts  plain-language message -> filters (who/what/where/amount)
    conversation.ts              turns a message into bot replies (text + match cards)
    draft.ts                     builds an application starter from message + grant
    savedMatches.ts              per-user saved drafts in localStorage
  pages/
    Home.tsx                     landing page (Hero + HowItWorks)
    Demo.tsx                     the core SMS-style flow: send text, get matches, get a draft
    Grants.tsx                   grants database with background-based matching
    Stories.tsx                  featured story + grid of community stories
    SignIn.tsx / SignUp.tsx      auth forms
    ForgotPassword.tsx           reset request + confirmation state
    Dashboard.tsx                placeholder protected page
    NotFound.tsx                 branded 404 page for unknown URLs
  components/
    auth/AuthLayout.tsx          split brand-panel + card layout for auth pages
    auth/TextField.tsx           labelled input with error, hint, show/hide
    auth/RequireAuth.tsx         route guard, redirects to /signin
    grants/GrantFilters.tsx      "Your background" filter panel
    grants/GrantCard.tsx         one grant result with match highlights
    demo/ChatParts.tsx           bubbles, typing dots, match list, draft card
    demo/IntentPanel.tsx         "What we understood" side panel
    Navbar.tsx                   sticky header, mobile hamburger menu
    Hero.tsx                     headline, CTAs, tag pills, photo + phone mockup
    PhoneMockup.tsx              iPhone-style SMS thread (messages passed as props)
    HowItWorks.tsx               three-step section
    BotanicalDecor.tsx           decorative corner leaf SVGs
    Footer.tsx
```

## Customising

- Colors and fonts live as CSS variables at the top of `src/index.css`.
- The demo conversation is the `demoMessages` array in `src/components/Hero.tsx`.
- The hero photo is an Unsplash URL in `Hero.tsx`; swap it for a local image in
  `public/` for production.
- Fonts (Fraunces + Inter) load from Google Fonts in `index.html`.

## The demo (core flow)

`/demo` simulates the SMS experience entirely in the browser:

1. The user types a message in everyday language (or taps a suggestion).
2. `parseIntent` reads out audiences (Black-owned, youth, faith-based...), focus
   areas, organization type, city/state and a dollar amount using keyword
   dictionaries in `intentKeywords.ts`. Nothing is sent anywhere.
3. `buildReplies` runs the same `searchGrants` ranking as the database page and
   answers with a short text plus up to three match cards. Vague messages get a
   clarifying question; impossible combinations get the closest alternatives.
4. "Get a draft" produces an application starter via `buildDraft`, which the
   user can copy, or save to their dashboard when signed in.

The side panel shows exactly which details were picked out of the message, with
a link to the same filters on `/grants`, so matching is never a black box.
Deep links work: `/demo?q=your message` starts the conversation immediately.

To replace the keyword parser with a real model or backend, swap `parseIntent`
in `conversation.ts`; everything downstream only needs a `Filters` object.

## Grants Database

`/grants` lets someone describe their background and see grants ranked by
fit. Filters:

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

The listings in `src/data/grants*.ts` are fictional sample data. Swap them
for a real feed (API or CMS) by changing what `grants.ts` exports; the page
and matching logic do not care where the array comes from.

## Stories

`/stories` shows one featured story in a dark panel with the grant and amount
alongside, then a grid of shorter stories with initials avatars, and a
"share your story" call to action. Content comes from `src/data/stories.ts`;
the entries there are fictional composites and carry a visible sample banner.
Set `featured: true` on the story you want at the top.

## Authentication

Routes: `/signin`, `/signup`, `/forgot-password`, and `/dashboard` (protected).

The UI talks to an `AuthService` interface defined in `src/auth/types.ts`.
Right now `App.tsx` passes `mockAuthService`, which keeps accounts in the
browser's localStorage so you can sign up, refresh and sign back in. It ships
with a demo login:

```
demo@civictext.org / password123
```

Passwords are never stored. The mock keeps a random per-account salt and a
PBKDF2-SHA256 hash (Web Crypto, 150k iterations), the same scheme a real
server would use. It is still development-only: verification runs in the
browser, so it protects the plaintext password but cannot stop someone with
the device from bypassing the check. Nothing leaves the browser.

To go live, write a class or object that implements `AuthService` against
Supabase, Firebase or your own API, and swap it in:

```ts
// App.tsx
<AuthProvider service={supabaseAuthService}>
```

No page or component needs to change.

## Deploying

This is a single-page app, so the host must serve `index.html` for every path
or the 404 page will never render on a direct visit. Netlify and Vercel do this
automatically for Vite projects. For GitHub Pages, copy `dist/index.html` to
`dist/404.html` after building.
