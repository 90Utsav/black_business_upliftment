"""Load hand-curated grants from data/seed_grants.json (demo + small-biz focus)."""
from __future__ import annotations

import json
from pathlib import Path

from ..config import DATA_DIR
from ..models import Grant

SEED_PATH = DATA_DIR / "seed_grants.json"


def load_seed(path: Path = SEED_PATH) -> list[Grant]:
    if not path.exists():
        return []
    return [Grant(source="seed", **item) for item in json.loads(path.read_text())]
