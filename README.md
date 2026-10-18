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
  pages/
    Home.tsx                     landing page (Hero + HowItWorks)
    SignIn.tsx / SignUp.tsx      auth forms
    ForgotPassword.tsx           reset request + confirmation state
    Dashboard.tsx                placeholder protected page
    NotFound.tsx                 branded 404 page for unknown URLs
  components/
    auth/AuthLayout.tsx          split brand-panel + card layout for auth pages
    auth/TextField.tsx           labelled input with error, hint, show/hide
    auth/RequireAuth.tsx         route guard, redirects to /signin
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

## Authentication

Routes: `/signin`, `/signup`, `/forgot-password`, and `/dashboard` (protected).

The UI talks to an `AuthService` interface defined in `src/auth/types.ts`.
Right now `App.tsx` passes `mockAuthService`, which keeps accounts in the
browser's localStorage so you can sign up, refresh and sign back in. It ships
with a demo login:

```
demo@civictext.org / password123
```

The mock is for development only. Passwords are stored lightly obfuscated,
not hashed, and nothing leaves the browser.

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
