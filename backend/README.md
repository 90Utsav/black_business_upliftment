# Grant finder backend (Python)

Stores grants, embeds them locally, and searches them by meaning.
Plan and phases: [../docs/RAG_PLAN.md](../docs/RAG_PLAN.md).

## Setup on a new laptop (macOS / Linux)

Needs Python 3.10+ (check with `python3 --version`) and about 1 GB of free disk.

```bash
git clone https://github.com/90Utsav/black_business_upliftment.git
cd black_business_upliftment
git checkout Bhabishya            # or whichever branch has the backend/ folder
cd backend

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # Windows: copy .env.example .env
```

Open `backend/.env` and fill in `LLM_API_KEY` (a Google Gemini key from
aistudio.google.com, free). Never commit this file or paste the key in chat.
The search itself does not need the key; only the chat/extraction steps do.

## Build the database (the database file is not in git, everyone builds their own)

```bash
python -m grantfinder.cli ingest --source all   # downloads ~80MB from Grants.gov, ~10s
python -m grantfinder.cli index                 # embeds grants locally; first run
                                                # downloads a ~130MB model, then ~10-15 min on CPU
python -m grantfinder.cli stats
python -m grantfinder.cli ask "flower pots and nursery plants"
```

Run `ingest` then `index` again any time to pick up new grants (only new or changed
grants are processed).

## Tests

```bash
python -m pytest -q
```

## Troubleshooting
- `command not found: python3`: install Python from python.org.
- `pip install` fails on a very new Python: use Python 3.11 or 3.12.
- First `index` seems stuck: it is downloading the model, then embedding on CPU. Let it run.
