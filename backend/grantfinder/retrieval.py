"""Phase 2: embed grants and find the closest ones to a query.

Only open/forecasted grants are embedded (closed ones are ~85% of rows and are not
what a user can apply to today). Vectors live in SQLite; cosine search is numpy,
which is instant at this scale (~1.5k vectors).
"""
from __future__ import annotations

import json
import sqlite3
import time
from datetime import datetime, timezone

import numpy as np

from .llm import EMBED_MODEL, get_embeddings
from .models import Grant

MODEL = EMBED_MODEL
BATCH = 200
PAUSE = 0


def _grant_from_row(r: sqlite3.Row) -> Grant:
    return Grant(source=r["source"], external_id=r["external_id"], title=r["title"], url=r["url"],
                 funder=r["funder"], description=r["description"][:1500], amount_min=r["amount_min"],
                 amount_max=r["amount_max"], deadline=r["deadline"], status=r["status"],
                 eligibility=r["eligibility"][:500], categories=json.loads(r["categories"]),
                 states=json.loads(r["states"]))


def index_grants(conn: sqlite3.Connection, embeddings=None) -> dict[str, int]:
    """Embed grants that are new or changed since their vector was built."""
    embeddings = embeddings or get_embeddings()
    todo = conn.execute(
        """SELECT g.* FROM grants g LEFT JOIN embeddings e ON e.grant_id = g.id
           WHERE g.status != 'closed' AND (e.grant_id IS NULL OR e.content_hash != g.content_hash OR e.model != ?)""",
        (MODEL,)).fetchall()
    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i + BATCH]
        texts = [_grant_from_row(r).search_text for r in chunk]
        for attempt in range(5):
            try:
                vecs = embeddings.embed_documents(texts)
                break
            except Exception as e:  # rate limit: wait and retry; give up after 5 tries
                if "RESOURCE_EXHAUSTED" not in str(e) or attempt == 4:
                    raise
                time.sleep(45)
        conn.executemany(
            "INSERT OR REPLACE INTO embeddings (grant_id, content_hash, model, vector) VALUES (?,?,?,?)",
            [(r["id"], r["content_hash"], MODEL, np.asarray(v, dtype=np.float32).tobytes())
             for r, v in zip(chunk, vecs)])
        conn.commit()
        print(f"  embedded {min(i + BATCH, len(todo))}/{len(todo)}", flush=True)
        if i + BATCH < len(todo):
            time.sleep(PAUSE)
    return {"embedded": len(todo)}


def search(conn: sqlite3.Connection, query: str, k: int = 5, embeddings=None,
           state: str | None = None) -> list[tuple[float, sqlite3.Row]]:
    """Top-k open grants by cosine similarity. `state` keeps nationwide + that state."""
    today = datetime.now(timezone.utc).date().isoformat()
    rows = conn.execute(
        """SELECT g.*, e.vector FROM grants g JOIN embeddings e ON e.grant_id = g.id
           WHERE g.status != 'closed' AND (g.deadline IS NULL OR g.deadline >= ?)""", (today,)).fetchall()
    if state:
        rows = [r for r in rows if not json.loads(r["states"]) or state in json.loads(r["states"])]
    if not rows:
        return []
    q = np.asarray((embeddings or get_embeddings()).embed_query(query), dtype=np.float32)
    m = np.vstack([np.frombuffer(r["vector"], dtype=np.float32) for r in rows])
    sims = (m @ q) / (np.linalg.norm(m, axis=1) * np.linalg.norm(q) + 1e-9)
    top = np.argsort(-sims)[:k]
    return [(float(sims[i]), rows[i]) for i in top]
