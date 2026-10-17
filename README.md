# CivicText landing page

Landing page for CivicText, an SMS grant finder for grassroots organizers.
Built with React 19, TypeScript and Vite. Styling is plain CSS with CSS Modules;
no UI framework.

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
  App.tsx / App.module.css       page shell
  components/
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
