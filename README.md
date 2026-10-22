# CivicText

CivicText helps small-business owners and community organizers discover funding opportunities through plain-language grant search. The project includes a React web application and a Python grant retrieval service with Telegram integration.

## Getting started

Requires Node.js compatible with the installed Vite release and Python 3.10+ for the backend.

```bash
npm install
npm run dev
```

The web application runs at `http://localhost:5173`. Backend configuration and commands are documented in [backend/README.md](backend/README.md).

## Development

```bash
npm run build    # TypeScript checks and production build
npm run lint     # Source linting
npm run preview  # Preview the production build
```

## Repository structure

| Directory | Purpose |
| --- | --- |
| `src/pages/` | Landing page, grant search, conversation demo, stories, and account pages |
| `src/components/` | Shared UI and feature components |
| `src/auth/` | Authentication interfaces, session state, and browser demo service |
| `src/data/` | Sample grant listings, stories, and shared data types |
| `src/lib/` | Grant ranking, intent parsing, conversations, and saved drafts |
| `public/` | Static assets |
| `backend/grantfinder/` | Grant ingestion, storage, request understanding, and retrieval |
| `backend/tests/` | Backend tests and retrieval evaluation cases |
| `docs/` | System architecture |

## Application features

- Grant search with audience, organization type, focus area, state, and funding filters.
- Browser conversation demo with match cards and application starters.
- Account pages and saved application drafts.
- Telegram grant requests backed by locally indexed grant records.

Search filters are stored in the URL for bookmarking and sharing. Styling uses CSS Modules with shared design tokens in `src/index.css`.

## Demo boundaries

The web conversation runs entirely in the browser and is separate from the Python service. Frontend grant listings are fictional examples; success stories are fictional composites. These are labeled in the interface.

Authentication uses a browser-only demo service backed by localStorage. Passwords are represented by salted PBKDF2-SHA256 hashes, but browser-side authentication does not provide server-enforced access control. The demo account is `demo@civictext.org` with password `password123`.

Backend data sources include curated records, unverified third-party listings, and Grants.gov. Data provenance and operational limitations are described in the [architecture](docs/ARCHITECTURE.md).

## Deployment

```bash
npm run build
```

Publish `dist/` to a static host configured to serve `index.html` for application routes. Backend hosting is a separate deployment and requires environment configuration, grant ingestion, and indexing. Fonts load from Google Fonts; the hero image loads from Unsplash.

## License

See [LICENSE](LICENSE).
