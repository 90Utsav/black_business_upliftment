# Grant Finder RAG: phased plan

Bhabishya (Python / LangChain), Utsav (website), Raunak (API + Twilio).

Flow: user message (SMS-style chat) → extract need → search stored grants → reply with best match.
No match → save a subscription → notify when a matching grant is ingested later.

Rule for every phase: it has an **exit check**, and we don't start the next phase until it passes.

| Phase | What | Exit check |
|---|---|---|
| 1. Storage + ingest ✅ | SQLite `grants` + `subscriptions`; Grants.gov ingestor; seed file; CLI | `ingest` twice → second run all `unchanged`; `pytest` green |
| 2. Retrieval 🟡 | Embed `Grant.search_text` with a local model (fastembed, bge-small), vectors stored in SQLite + numpy cosine search (no Chroma needed at this size); re-index only new/changed grants; filter (open, deadline, state). Built; waiting on more small-business data to pass the check | A set of ~10 test queries ("flower pots", "nursery") returns the right grant in top 3 |
| 3. Understanding | LLM extraction prompt → `{category, need, amount, state, business_type}` (structured output, Pydantic) | Extraction unit tests on ~10 sample messages |
| 4. Answering | `process_grant_request(user_text) -> str`: extract → retrieve → rerank → draft ≤ 2 SMS (~320 chars): name, deadline, link, opening line. Must only use stored grant facts (no invented grants/dates) | Replies fit length cap; no-match path returns a polite "we'll text you" |
| 5. Waitlist + notify | On no match insert `subscriptions`; after each ingest, match new grants vs open subscriptions, mark `notified_at` | Fake subscription gets matched after a seeded grant is added |
| 6. Chat interface | FastAPI `POST /api/chat` + SMS-styled chat page (dummy SMS thread). Same endpoint the Twilio webhook will call later | Ask in the UI, get a reply |
| 7. Merge | Plug into Utsav's React site; friend wires Twilio to the same function | Demo end to end |

## Decisions made
- **Language/stack**: Python + LangChain; SQLite for storage (zero setup, a single file).
- **Data sources**: Grants.gov public API (no key) + hand-written `backend/data/seed_grants.json` for small-business/local grants that federal data lacks. More sources (SBA, state/foundation lists) plug in as new files in `grantfinder/ingest/` returning `Grant` objects.
- **Twilio**: friend's side. Our function stays transport-agnostic: text in, text out.

## Known gaps / risks
- Grants.gov is mostly federal and large (often for nonprofits/governments). Few micro-grants for a flower seller → seed data and extra sources matter for the demo.
- The website's sample grants (`src/data/grants*.ts`) are fictional TypeScript; to demo with the same data, export them to `seed_grants.json` (phase 2 task).
- LLM provider/key not chosen yet (needed from phase 3). Keep keys in `backend/.env`, never committed.
