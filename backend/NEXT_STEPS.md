# Next steps: plan to the deadline (Oct 23, 11:59 PM)

Written 2026-10-21. Companion to `SUMMARY.md` (what exists) and `docs/RAG_PLAN.md` (original plan, outdated).
Owners: **B** = Bhabishya (grant brain), **R** = Raunak (Telegram server), **U** = Utsav (website).

**Status on Oct 21:** the Telegram bot runs end to end on Bhabishya's own test bot (message in, grant reply out).
The reply logic, the understanding step and the webhook are built and tested offline (30 tests). The data is still
dummy, and several things below can fail in a live demo.

---

## Today (Oct 21): lock in what works

- [ ] **B: commit and push** to `Bhabishya` (commit without a co-author trailer; B commits it themselves).
- [ ] **B: send R the setup steps** (section "Setup for Raunak" at the bottom of this file).
- [ ] **B + R: rotate secrets.** Revoke the old Telegram bot token (it is in git history), the one pasted in chat,
      and the old skimming.ai key. Revoking is done in Telegram: `@BotFather`, `/revoke`.
- [ ] **B: send 10 real messages from a phone** (flowers, bakery, Latina tamales, tattoo parlor, "I need money",
      "hi", a Spanish one) and note anything wrong. This shows which of the problems below actually matter.
- [ ] **B: fix the false promise.** The no-match reply says "I'll message you here if a matching grant is added", but
      nothing notifies anyone yet. Either build phase 5 (below) or reword it (2 minutes).

## Tomorrow (Oct 22): the demo itself

1. [ ] **B: real grants with working links.** *Biggest demo risk.* Every grant today has an `example.org` link and
       "(sample)" in its title. Replace or add 15 to 30 real ones in `data/seed_grants.json`, each hand-checked for a
       working link, a real deadline and who may apply. Do not invent any. Candidates to look up and verify (not
       confirmed open): Amber Grant, FedEx Small Business Grant Contest, Hello Alice grants, plus state and city
       small-business programs, and programs aimed at Black, Latino, women and veteran owners. Then run
       `python -m grantfinder.cli ingest` and `index`.
2. [ ] **B: audience rule** (design below).
3. [ ] **B: re-run the evaluation** (`python tests/eval/run.py all`, about 5 minutes) to check the latest matching
       changes did not break anything. Add new unseen messages to `tests/eval/cases.py`.
4. [ ] **B + R: decide hosting** (options below).
5. [ ] **U + B: website QR code** that opens `https://t.me/<bot_username>`. Note: a QR deep link sends `/start something`
       (see "small fixes").
6. [ ] **B (if time): phase 5, waitlist notify** (design below). Cut it if the day runs short.

## Oct 23: freeze and rehearse

- [ ] **Morning:** last fixes only. **Stop adding features by mid-afternoon.**
- [ ] **Merge into `main`** (PR from `Bhabishya`), after checking the website still builds (`npm run build`).
- [ ] **Update `README.md`, `docs/RAG_PLAN.md` and `SUMMARY.md`** (they still describe SMS and the old plan).
- [ ] **Write and rehearse a 5-message demo script** using messages you have confirmed work on the final data.
- [ ] **Backup:** screenshots and a short screen recording of the bot working, in case the live demo fails.
- [ ] **Before 11:59 PM:** final push; confirm R's server and the website QR code both work from a fresh start.

---

## What is missing or can fail, ranked

### Major (can embarrass you in a demo)
1. **Dummy data and dead links.** See tomorrow, item 1.
2. **The no-match promise is false** until phase 5 is built.
3. **Rate limit: 15 requests per minute per model on the free Gemini tier** (about 45 across the three-model fallback
   chain). Several people trying the bot at once can hit it; the user then sees "Sorry, I'm having trouble right now".
   Mitigations: cache repeated questions, or move the key to a paid plan for the demo (a few cents).
4. **Wrong-group grants are shown.** Eligibility is not enforced: a "Black-owned businesses" grant can be shown to a
   flower seller who never said that. The audience rule below fixes it.
5. **The server is a laptop.** It goes down if the laptop sleeps or ngrok restarts (the address changes and the webhook
   must be registered again).

### Medium
6. **No conversation memory.** "Bakery in Georgia" works as a reply to "what kind of business?", but a bare "in Georgia"
   is treated as a new, vague message.
7. **Latest matching changes are unverified** against the real messages, and federal-grant noise can still produce odd
   matches (an embassy grant for a candle maker, an education-research grant for a piano teacher).
8. **Anyone who knows the webhook URL can send fake messages** and burn LLM quota. Telegram supports a secret header
   (`secret_token` in `setWebhook`) to reject them.
9. **Privacy question to be ready for:** user messages are sent to Google's Gemini. Fine for a hackathon; a judge may ask.
10. **The 0.93 match cutoff is tuned to dummy data** and must be re-checked after real grants go in.

### Minor
11. Plain-text replies only (no buttons yet).
12. Long grant descriptions are cut to the first sentence.
13. Docs out of date (see Oct 23).
14. Four audience tags (`latino`, `asian`, `native-american`, `disability`) are not website filters.

### Errors seen so far
Only Gemini `429` (rate limit) and `503` (model overloaded) errors, which the fallback chain handles. No Telegram-side
errors have been recorded yet, because nobody has logged real runs.

---

## Design notes for the planned work

### Audience rule (decided, not built)
- User states a group ("Black-owned", "Latina", "veteran"): return that group's grants first; if there are none, fall
  back to general grants.
- User states no group: return **general grants only**, not ones restricted to a group.
- To know a grant's group, scan its title and eligibility text for group words and tag it automatically, so no data
  entry is needed and it works for grants added later. This would replace the keyword-weight logic currently used for
  audience words.
- Later: Telegram buttons under the bot's message ("Who is this for? [Black-owned] [Latino] [Women] [None]"). Needs the
  webhook to also handle button taps, so do the text rule first.

### Phase 5: waitlist notify
1. The `subscriptions` table and the save-on-no-match already exist (`contact` holds the Telegram `chat_id`).
2. After each `ingest` + `index`, take grants that are new since the last run and match each against every un-notified
   subscription using the same understanding and matching code.
3. For each match, send a Telegram `sendMessage` to that `chat_id` with the grant reply, then set `notified_at`.
4. Done when a test user who got "no match" receives a message after a matching grant is added.

### Hosting options
- **Laptop + ngrok** (current): zero setup, fragile. Keep the laptop awake and plugged in, keep ngrok running, and
  re-register the webhook if the address changes.
- **Free cloud host** (Render, Railway, Fly.io or similar): stable URL, but needs the database built there (run
  `ingest` and `index` on the host) and the model download (~130 MB) on first start.
- Either way only **one server can receive a given bot's messages at a time**. Use separate bot tokens for development
  and for the demo.

### Small fixes worth doing
- **`/start` from a QR code:** a deep link sends `/start something`. The greeting shortcut in `answer.py` only matches a
  bare `/start`, so these go to the LLM. Allow trailing text and `/start@botname`.
- **Telegram secret header** for the webhook (problem 8).
- **Cache** repeated messages (problem 3).

---

## If there is only time for five things
1. Real grants with working links.
2. The audience rule.
3. Fix or build the "we'll notify you" promise.
4. A rehearsed demo script plus a screen-recording backup.
5. A decision on hosting.

---

## Setup for Raunak (about 20 minutes)

1. `git fetch`, then `git merge origin/Bhabishya` (on a branch you work on). If `backend/main.py` conflicts, keep Bhabishya's
   version: same file, token moved to `.env`, reply now comes from the grant code.
2. Revoke the old bot token in `@BotFather` (`/revoke`) and copy the new one.
3. `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
4. `cp .env.example .env`, then fill in `LLM_API_KEY` (Gemini key, sent privately; or a free one from aistudio.google.com)
   and `TELEGRAM_TOKEN`. Never commit `.env`.
5. Build the database: `python -m grantfinder.cli ingest` then `python -m grantfinder.cli index` (first run downloads a
   ~130 MB model). For a faster start with only the sample grants: `ingest --source seed`.
6. Check the grant code first: `python -m grantfinder.cli chat "I sell flowers and need money for flower pots"`.
7. Start the server: `uvicorn main:app --port 8000` (wait for "Application startup complete").
8. Expose it: `ngrok http 8000`, then copy the `https://...` address.
9. Register the webhook in a browser:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<ngrok-address>/webhook` (expect `"ok":true`).
10. Message the bot: `/start`, a flower-pots request, a tattoo-parlor request (expect "couldn't find"), and `I need money`
    (expect a follow-up question).

If it fails: no reply and nothing in the uvicorn terminal means check `getWebhookInfo`
(`https://api.telegram.org/bot<TOKEN>/getWebhookInfo`); `sendMessage failed 401/404` means a wrong token; an error reply
usually means a missing or wrong `LLM_API_KEY`; slow or bursty failures mean the free-tier rate limit (wait a minute).
