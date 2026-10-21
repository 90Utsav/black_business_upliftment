from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "grants.db"

# Queries sent to Grants.gov on every ingest run. Broad on purpose: the RAG
# layer (phase 3) does the fine-grained matching, ingest only has to cast a net.
GRANTS_GOV_QUERIES = [
    "small business",
    "minority business",
    "nursery horticulture",
    "agriculture farm",
    "urban agriculture",
    "microenterprise",
    "rural business",
    "entrepreneur",
]
