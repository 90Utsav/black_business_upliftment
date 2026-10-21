# Backend summary: what we built and what comes next

Written for: a teammate learning this project from scratch. Last updated 2026-10-18 at 12:57 PM.

## 1. The goal in one paragraph

A small-business owner (say, a flower seller) texts a question like "grants for flower pots or
nursery". Our system works out what they need, searches a database of grants collected from the
internet, and replies with the best match, including the deadline and a link. If nothing matches,
we remember the person, and the moment a fitting grant shows up later we notify them. For now the
"text message" is a fake SMS-style chat on the website; real SMS (Twilio) is a teammate's job.

## 2. Key terms (read this first)

- **Grant**: money given to a person or business that does not have to be paid back.
- **Ingest**: pulling data from outside sources into our own database. "Ingesting Grants.gov" means
  downloading its grants and saving them to our database.
- **API**: a way for programs to talk to each other over the internet. Grants.gov has a public one
  we can ask "give me grants about X". Different from a *website*, which is meant for humans.
- **SQLite**: a database that is just one file on your computer (`backend/data/grants.db`). No server
  to install.
- **LLM (large language model)**: an AI like Gemini or Claude that reads and writes text. We use it
  to understand the user's message and write the reply.
- **Embedding / vector embedding**: a list of numbers (here 384 of them) that represents the
  *meaning* of a piece of text. The text "horticulture supplies" and "plant nursery" get very
  similar numbers even though they share no words. A *vector* is just such a list of numbers.
- **Embedding model**: the small program that turns text into those numbers. Ours is
  `BAAI/bge-small-en-v1.5`, runs on your own laptop, free, no key.
- **Cosine similarity**: the math that scores how close two vectors are (1 = same meaning, 0 =
  unrelated). Searching = score the question against every grant, return the highest.
- **Semantic search**: searching by meaning (using embeddings) instead of by exact keywords.
- **Retrieval**: the "find the relevant grants" step.
- **RAG (Retrieval-Augmented Generation)**: the pattern our whole project follows. (1) *Retrieve*
  relevant documents from our database, (2) hand them to an LLM along with the user's question,
  (3) the LLM *generates* an answer using only those documents. Why: an LLM alone makes up grants
  that do not exist and does not know today's deadlines. With RAG it answers from real data.
- **LangChain**: a Python library with ready-made building blocks for LLM apps (calling models,
  prompts, chaining steps).
- **Prompt**: the instructions and text we send to the LLM.
- **Idempotent**: safe to run repeatedly. Running ingest twice does not create duplicates.
- **Webhook / Twilio**: Twilio is a service that turns SMS into web requests to our server. The
  incoming text arrives at a URL (the webhook), we reply with text. Teammate Raunak owns this.
- **Rate limit / quota**: the maximum calls an online service lets you make per minute or day.

## 3. How the system fits together

```
 user message ──► [3 Understand: LLM extracts need]   (not built yet)
                          │
                          ▼
 [1 Ingest] ──► SQLite ──► [2 Retrieval: embeddings + similarity search] ──► top grants
 (Grants.gov,   grants.db        (built)                                         │
  seed file)                                                                     ▼
                                              [4 Answer: LLM writes the reply, ≤2 SMS]
                                                 │ no match? ──► SBIR fallback text +
                                                 ▼               save in subscriptions table
                                           reply to the user
```

## 4. What we did, step by step

### Step A: Looked at the existing repo
The website (React + TypeScript, by Utsav) already had sample grants as fake data in `src/data`.
We decided the Python backend lives in its own folder, `backend/`, and does not touch the website.

### Step B: Storage (phase 1)
- `grantfinder/models.py`: defines a `Grant` (title, funder, description, amount, deadline,
  eligibility, states, url...). Every source, however messy, gets converted into this one shape.
- `grantfinder/db.py`: creates the SQLite tables:
  - `grants`: all grants. Each has an id like `grants.gov:363998`. A fingerprint (`content_hash`)
    detects when a grant has really changed.
  - `embeddings`: one vector per grant.
  - `subscriptions`: people who got no match, for the notify-later feature (table exists, logic
    not written).
- Upsert logic: new grants are inserted, changed ones updated, identical ones skipped. We fixed a
  real bug here: the Grants.gov API returned eligibility lists in random order, making every grant
  look "changed" each run. Sorting the list fixed it. Re-running is now safe.

### Step C: Collecting grants (ingest)
- **Grants.gov keyword API** (`ingest/grants_gov.py`): asks the public API for grants matching
  keywords. Only got ~30 grants, so we replaced it as the main method.
- **Grants.gov bulk extract** (`ingest/grants_gov_bulk.py`): Grants.gov publishes its entire
  database daily as an 80 MB zip (a 320 MB XML file). We download it and stream through it.
  Result: **10,160 grants** (868 open, 590 upcoming, 8,702 recently closed; 73,000 archived ones
  are skipped). Takes ~10 seconds.
- **Seed file** (`ingest/seed.py` + `data/seed_grants.json`): a hand-written list for grants no API
  provides. "Seed" here just means "starting data we plant by hand". It contains:
  one **fake sample** flower-pot grant (a placeholder for testing, delete it before the real demo)
  and the real **SBA STEP** export grant (46 states).
- **Key discovery**: only ~1,450 federal grants are open at any time, and just 239 are open to
  small businesses or individuals, mostly research programs. Federal data has almost nothing for a
  flower seller. Real small-business grants live in state/city/foundation sources.

### Step D: Researched your website list
- SBA page: SBA says it does not give grants for starting a business. Only STEP was useful (added).
  SBIR/STTR is already on Grants.gov.
- US Chamber and DC DMPED pages: readable, good future sources (need an LLM to read them).
- Commerce.gov: blocked bots (403). TheGrantPortal: commercial, asks bots to wait 5s, terms may
  forbid copying. We decided not to copy it wholesale without permission.

### Step E: LLM key
- skimming.ai turned out to be a video-summary product with no public model API, so its key could
  not be used. We switched to a free **Google Gemini** key. It works (chat model
  `gemini-3.8-flash`). The old `gemini-2.5-flash` was retired for new accounts.
- `grantfinder/llm.py` is the single place that reads `backend/.env` (where the key lives, ignored
  by git) and builds the clients. Changing provider later means editing only this file.
- **Security note**: a key was pasted in chat earlier. Revoke the skimming key.

### Step F: Retrieval (phase 2)
- `grantfinder/retrieval.py`: turns each open/upcoming grant's text into a vector and stores it.
  Search = embed the question, compare with every grant vector, return the top matches.
- First tried Google's embeddings, but the free tier allows only 1,000 per day, which we hit at 850.
  Switched to a **local** embedding model (fastembed, ~130 MB, no limits). All 1,460 open/upcoming
  grants are now embedded.
- Commands: `python -m grantfinder.cli ingest`, `index`, `ask "question"`, `stats`, `search`.

### Step G: The SBIR fallback
`grantfinder/fallback.py` holds a paragraph (and a 173-character SMS version) about America's Seed
Fund (SBIR/STTR) at sbir.gov, shown to every user who gets no match. Award ceilings are from
sbir.gov/about; the eligibility and timing statements are the program's standard rules and should
be double-checked on the site.

### Step H: Test results
Search works when a good grant exists (the STEP query scored 0.74 and found the right grant). For
bakery, food truck, flower pots and basketball camp it returned weak matches (scores ~0.55-0.62)
because the database has no matching grants. Real matches score about 0.7; junk about 0.55-0.6.
A cutoff near 0.65 can route junk to the no-match path. **Phase 2's exit check is not yet passed;
it needs real small-business data.**

## 5. Where things are

```
backend/
  SUMMARY.md            this file
  README.md             setup steps for another laptop
  requirements.txt      Python packages
  .env                  your secrets (NOT in git)    .env.example  the template (in git)
  data/
    seed_grants.json    hand-written grants (in git)
    grants.db           the database (NOT in git, rebuilt by ingest + index)
    cache/              the downloaded Grants.gov zip (NOT in git)
  grantfinder/
    models.py db.py config.py llm.py retrieval.py fallback.py cli.py
    ingest/  grants_gov.py  grants_gov_bulk.py  seed.py
  tests/test_ingest.py  3 passing tests
docs/RAG_PLAN.md        the 7-phase plan with exit checks
```

## 6. What to do next, in order

Each step has a "done when" check. Do not start the next one until it passes.

1. **Save the work in git.** Commit and push the `Bhabishya` branch. Done when teammates can see
   `backend/` on GitHub (and no `.env` or `.db` file is in it).
2. **Revoke the exposed skimming key** and keep the Gemini key only in `backend/.env`.
3. **Delete or label the fake placeholder grant** in `seed_grants.json` before any demo.
4. **Add real small-business grants (the biggest gap).** Build a generic "read a web page, let the
   Gemini LLM extract each grant" ingestor, plus a `sources.yaml` listing pages. Start with the US
   Chamber list, DC DMPED, then state and city small-business portals. Hand-add good ones too.
   Done when: the database holds a few hundred real small-business grants and the flower/bakery/
   food-truck test queries return a sensible grant in the top 3.
5. **Finish phase 2.** Add a similarity cutoff (~0.65) and a state filter. Re-run the test
   queries. Done when ~10 test questions return the right grant or correctly return nothing.
6. **Phase 3, Understanding.** A prompt that turns "I run a youth basketball camp and need money
   for jerseys" into `{category, need, amount, state, business type}`. Done when it passes unit
   tests on ~10 sample messages.
7. **Phase 4, Answering.** `process_grant_request(user_text) -> str`: understand, retrieve, have
   the LLM write a reply of at most 2 SMS (grant name, deadline, link, a first sentence for the
   application). It may only use facts from the stored grant. No match gives the SBIR fallback.
   Done when replies fit the length cap and never invent grants or dates.
8. **Phase 5, Waitlist and notify.** On no match, save the user to `subscriptions`. After each
   ingest, check new grants against waiting users and mark them notified. Done when a test user is
   matched after a matching grant is added.
9. **Phase 6, Chat interface.** A web endpoint (FastAPI `POST /api/chat`) and an SMS-styled chat
   page. Done when you ask in the browser and get a reply. Raunak's Twilio webhook will call the
   same function.
10. **Phase 7, Merge.** Plug the chat into Utsav's site, wire Twilio, and demo end to end.
11. **Ongoing.** Re-run `ingest` and `index` daily so new grants appear; keep the pitch story
    honest about data coverage.

## 7. Questions we have not decided yet
- Who hosts the running backend (your laptop for the demo, or a free cloud service)?
- Do we have permission to use TheGrantPortal's listings (API, login, or written OK)?
- Real Twilio (needs a paid upgrade) or the simulated SMS chat only?
