# Backend summary: what we built, what is broken, what comes next

Written for: a teammate picking up this project. Last updated 2026-10-20 (two work sessions: Oct 18 and Oct 20).

## 1. The goal in one paragraph

A small-business owner (say, a flower seller) messages our **Telegram bot**: "grants for flower pots or
nursery". The system works out what they need, searches a database of grants, and replies with the best
match, including the amount, deadline and a link. If nothing matches, it saves the person so they can be
told later when a fitting grant appears. We moved from a fake SMS-style web chat to Telegram because it is
free (Twilio's trial blocks custom message bodies). Raunak owns the Telegram server, Utsav owns the website,
the grant brain (this folder) is Bhabishya's.

## 2. Key terms

- **Grant**: money given to a person or business that does not have to be paid back. A *loan* is not a grant.
- **Ingest**: pulling grants from outside sources into our own database.
- **SQLite**: a database that is just one file (`backend/data/grants.db`). No server to install.
- **LLM**: an AI like Gemini that reads and writes text. We use it only to *understand* the user's message.
- **Embedding**: a list of numbers (384) that represents the *meaning* of a text. Similar meanings get similar
  numbers. Ours comes from a small local model, `BAAI/bge-small-en-v1.5`: free, no key, no limits.
- **Cosine similarity**: the score (0 to 1) of how close two embeddings are.
- **RAG**: retrieve relevant documents first, then answer only from them, so the bot cannot invent grants.
- **Hybrid search**: our search = embedding similarity plus a keyword-overlap check (see section 5).
- **Audience**: the group an owner belongs to (Black-owned, Latino, women-led, veteran...).
- **Webhook**: a URL on our server where Telegram POSTs every message sent to the bot (`/webhook`).
- **Rate limit**: the maximum requests a free online service allows per minute.
- **Fallback chain**: if the main LLM model errors or hits its limit, the next model is tried automatically.

## 3. How the system fits together

```
 Telegram user ──► Telegram servers ──► POST /webhook  (backend/main.py, Raunak's server)
                                              │ process_grant_request(text, chat_id)
                                              ▼
   [understand.py] Gemini turns the text into: intent, need, category, business_type,
                   audience[], state, amount, search_query
        │ greeting / off-topic / too vague ──► fixed reply (no search)
        ▼
   [retrieval.py] embed search_query ─► compare with every open grant ─► re-rank by keyword overlap
        │
        ▼
   [answer.py] reply built from the stored grant's own fields (title, amount, deadline, link)
        │ no match ──► save the person in `subscriptions` + show the SBIR/STTR fallback text
        ▼
   send reply back through Telegram
```

The reply is **filled in from the database, not written by an LLM**, so it cannot invent a deadline or amount.

## 4. What we did

### Session 1 (Oct 18): storage, ingest, retrieval
- **Storage** (`models.py`, `db.py`): SQLite tables `grants`, `embeddings`, `subscriptions`. Re-ingesting is safe
  (new rows inserted, changed rows updated, identical rows skipped).
- **Ingest**: the Grants.gov daily bulk extract gives about 10,000 federal grants (~1,450 open at a time, but
  only ~240 open to small businesses or individuals, mostly research programs). Plus a hand-written seed file.
- **Retrieval**: open and upcoming grants are embedded locally and searched by cosine similarity.
- **Fallback text** (`fallback.py`): a paragraph about SBIR/STTR (sbir.gov), shown when nothing matches.
- **Finding**: federal data has almost nothing for a flower seller. Real micro-grants live in state, city and
  foundation sources.

### Session 2 (Oct 20): understanding, answering, Telegram
1. **Merged Raunak's work.** His Telegram `backend/main.py` and Utsav's website changes came in through
   `git merge origin/main`. The only conflict was `.gitignore`; both sets of lines were kept.
2. **Fixed `requirements.txt`.** It was missing `fastapi`, `uvicorn`, `requests`, `fastembed` and `pydantic`.
3. **Phase 3, understanding** (`understand.py`). One Gemini call with structured output returns the fields above.
   Python then cleans it (state names become 2-letter codes, bad amounts become `None`). It also handles
   greetings and off-topic or loan messages (`intent`). `audience` has 14 tags: the website's 10
   (`black-owned`, `women-led`, `youth`, `faith-based`, `immigrant`, `veteran`, `lgbtq`, `rural`, `first-time`,
   `formerly-incarcerated`) plus 4 we added (`latino`, `asian`, `native-american`, `disability`).
4. **Speed: 19 s per call down to about 1 s.** The slowness was Google's `gemini-3.8-flash` returning "503 high
   demand" while the client silently retried with long backoff. We switched to `gemini-3.5-flash-lite`, set a
   20 s timeout and 1 retry, and added a **fallback chain** (`gemini-3.5-flash-lite`, then `gemini-3.1-flash-lite`,
   then `gemini-3.5-flash`). Quotas are per model.
5. **Free-tier limit: 15 requests per minute per model** (read from the actual 429 error). A burst of testing
   hits it; one user typing normally does not.
6. **Dummy database.** 30 seed grants (all titled "(sample)", links at `example.org`) covering food, beauty,
   retail, trades, childcare, tutoring, wellness, creative work and identity-led groups (Black, Latino, Asian,
   Native, disability, women, LGBTQ+, veteran, immigrant, formerly incarcerated, young). Quality of the data does not
   matter for now; it exists so the pipeline can be shown working. Real grants are added later.
7. **Phase 4, answering** (`answer.py`): `process_grant_request(user_text, chat_id=None) -> str`.
   Greetings and `/start` are answered without calling the LLM. Off-topic gets "I only find grants". A request with
   nothing specific ("I need money", "any grants in Ohio?") gets a follow-up question. Otherwise: search, reply
   with the best grant plus up to 2 more. An LLM error returns a polite "try again" and never crashes.
   No match saves one row in `subscriptions` (keyed by `chat_id`, no duplicates) and shows the SBIR text.
8. **Matching quality.** A plain similarity cutoff does not work: the local model scores almost everything between
   0.6 and 0.8, so "tattoo parlor" scored higher against an artist grant than the real flower grant did. We added:
   a keyword-overlap check (a grant must share a specific word with what the user said), stemming (flowers/flower,
   plumber/plumbing), spelling groups (Latina/Latinx/Latino, woman/women), a state-specific grant bonus, and a
   cutoff (`MIN_SCORE = 0.93`).
9. **Edge-case testing.** A 51-message harness (lasagna, braids, henna, tamales, trucking, deaf owner, Spanish,
   loans, junk, prompt injection and more) went from **24/51 to 51/51** after fixes. On **18 fresh messages we had
   not tuned on, it scored 13/18**, which is the honest number.
10. **Telegram wiring** (`backend/main.py`). The hardcoded bot token is gone (it now comes from `TELEGRAM_TOKEN` in
    `.env`). `/webhook` now calls `process_grant_request(text, chat_id)` and sends the result back. The lookup runs
    in a worker thread, each Telegram `update_id` is answered once, replies are cut to Telegram's 4,096-character
    limit, and a crash still gives the user a reply. Tested with a dummy token against the real server; real
    delivery has **not** been tested.

## 5. Where things are

```
backend/
  SUMMARY.md             this file
  main.py                FastAPI Telegram webhook (Raunak's file, now calling our function)
  README.md              setup steps
  requirements.txt       Python packages
  .env                   secrets (NOT in git)        .env.example   template (in git)
  data/
    seed_grants.json     30 hand-written dummy grants (in git)
    grants.db            the database (NOT in git: run ingest + index to build it)
  grantfinder/
    understand.py        message -> structured request (Gemini)
    answer.py            process_grant_request: the whole reply logic
    retrieval.py         embeddings, search, keyword re-ranking
    llm.py               the only file that builds LLM clients (model list + fallbacks)
    fallback.py          SBIR/STTR no-match text
    cli.py db.py models.py config.py ingest/
  tests/                 44 pytest tests: 30 run offline, 14 call the real LLM (need a key)
    eval/cases.py        69 hand-written messages with acceptable outcomes (TUNED 51, HOLDOUT 18)
    eval/run.py          runs them through the real pipeline and prints misses (not part of pytest)
docs/RAG_PLAN.md         the original plan (still describes SMS; see section 8)
```

## 6. How to run and test

From `backend/` with `source .venv/bin/activate`:

```bash
python -m grantfinder.cli ingest          # load grants (seed + Grants.gov), then:
python -m grantfinder.cli index           # embed new grants (needed after every ingest)
python -m grantfinder.cli chat "I sell flowers and need money for flower pots"   # full pipeline, no Telegram
python -m grantfinder.cli understand "..."                                       # only the understanding step
python -m pytest tests -q -k "not live"   # offline tests (30)
python -m pytest tests -q                 # all tests, including real LLM calls
python tests/eval/run.py all              # the 69-message evaluation (real LLM, ~5 min, paced for the rate limit)
uvicorn main:app --port 8000              # the Telegram server (needs TELEGRAM_TOKEN in .env)
```

Needed in `backend/.env`: `LLM_API_KEY` (Gemini), `TELEGRAM_TOKEN`. Optional: `LLM_MODEL`, `LLM_FALLBACK_MODELS`.
`grants.db` is not in git, so a new machine must run `ingest` and `index` before the bot has anything to search.
Wait a minute between large test batches: the free LLM allows 15 requests per minute per model.

## 7. Problems right now

1. **Latest matching changes are unverified.** After the last full test run we changed matching so that only the
   user's own words open the match gate, federal grants open only to governments or universities are skipped, state
   names do not count as keywords, and "any grants in Ohio?" asks a follow-up. They pass the 30 offline tests but were
   never re-run against the 51 + 18 real messages.
2. **Federal grants add noise.** Long federal descriptions share words by accident. The fresh set matched a candle
   maker to a U.S. Embassy grant, a piano teacher to an education-research grant, and a lash studio to a university
   program. The fixes in problem 1 target this.
3. **Eligibility is not enforced.** Grants only carry eligibility as free text. A "Black-owned businesses" grant can
   be shown to someone who did not say they are Black-owned, and an immigrant grant to a non-immigrant.
4. **The 0.93 cutoff is tuned to the dummy data.** Re-check it after adding real grants.
5. **Telegram has not been tested for real.** Only with a dummy token. Nobody on the AI side has a Telegram account yet.
6. **The waitlist promise is false right now.** The no-match reply says "I've saved your request and will message you
   here if a matching grant is added", but phase 5 (the notifying) is not built.
7. **Free-tier limit: 15 requests per minute per model.** About 45 per minute across the three-model fallback chain.
   Fine for one user, a risk for a demo with several people at once.
8. **Security.** The old Telegram bot token was committed to git by mistake: it must be revoked in @BotFather
   (`/revoke`) and replaced. The old skimming.ai key (from session 1) should also be revoked.
9. **The 18 "fresh" messages are no longer fresh.** We used them to find bugs, so they now count as tuned-on. New unseen
   messages are needed to measure real quality (the harness is in `tests/eval/`, see section 6).
10. **Four audience tags (`latino`, `asian`, `native-american`, `disability`) are not website filters.** Utsav's site
    only has the original 10.

## 8. Next steps, in order

1. **Test the Telegram bot for real.** Raunak (or anyone with Telegram) merges this branch, adds `TELEGRAM_TOKEN` and
   `LLM_API_KEY` to his `.env`, runs `ingest` and `index`, starts the server, and messages the bot. Revoke the old
   token first.
2. **Re-run the evaluation** (`python tests/eval/run.py all`) and see whether the latest matching changes helped or
   broke anything. Then add new unseen messages to `tests/eval/cases.py`.
3. **Audience rule (decided, not built).** If the user states a group ("Black-owned", "Latina"), return grants for that
   group first; if nothing exists for it, fall back to general grants. If the user states no group, return only
   general grants, not ones restricted to a group. The simplest way to know a grant's group is to scan its title and
   eligibility text for group words and tag it automatically.
4. **Select-criteria buttons on Telegram** (for example "Who is this for? [Black-owned] [Latino] [Women] [None]").
   Needs the webhook to also handle button taps.
5. **Phase 5, waitlist and notify.** After each `ingest`, match new grants against saved users and send them a Telegram
   message (the saved `chat_id` is the address). Until then, change the no-match wording so it does not promise this.
6. **Real data**, when the demo flow works: a generic "read a web page, let Gemini extract each grant" ingestor with a
   `sources.yaml` (US Chamber list, DC DMPED, state and city portals), then re-check the 0.93 cutoff and delete the sample grants.
7. **Update `docs/RAG_PLAN.md` and `README.md`**, which still describe SMS and the old plan.
8. **Merge and demo** with Utsav's website (a QR code that opens the bot).

## 9. Skipped or changed from the original plan

- **SMS-style web chat page and `POST /api/chat` (old phase 6): dropped.** Telegram replaced it. The function stays
  transport-agnostic, so a website chat can still call `process_grant_request`.
- **Twilio / real SMS: dropped** (paid, trial limits). Telegram is free.
- **Real small-business data (old step 4): postponed on purpose.** We decided a dummy database is fine for now.
- **Phase 2's original exit check** (right grant in the top 3 for ten real queries) was replaced by the 51/18-message
  evaluation on dummy data, because real data does not exist yet.
- **Phase 3's "unit tests on ~10 samples"**: done (14 live and 5 offline tests).
- **LLM-written replies, a second LLM re-ranking call, and conversation memory: skipped.** Replies come from templates
  (cannot invent facts), and each message is handled on its own.
- **Loan vs grant handling: partial.** Loans get "I only find grants"; there is no special loan guidance.
- **Caching repeated questions: skipped.** It would help with the rate limit.
- **Deleting the original fake flower-pot grant (old step 3): not done.** It is one of the 30 "(sample)" grants and
  should go before a real demo.
- **TheGrantPortal permission and hosting decision: still undecided.** Who hosts the running server (a laptop with
  ngrok for the demo, or a free cloud service) is still open.
