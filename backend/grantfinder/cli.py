"""python -m grantfinder.cli ingest [--source grants.gov|seed|all] [--per-query N]
   python -m grantfinder.cli stats | search <text>
"""
from __future__ import annotations

import argparse

from . import db, retrieval
from .ingest import grants_gov, grants_gov_bulk, seed


def main() -> None:
    p = argparse.ArgumentParser(prog="grantfinder")
    sub = p.add_subparsers(dest="cmd", required=True)
    ing = sub.add_parser("ingest")
    ing.add_argument("--source", choices=["grants.gov-bulk", "grants.gov", "seed", "all"], default="all")
    ing.add_argument("--per-query", type=int, default=25)
    sub.add_parser("index", help="embed new/changed grants (needs LLM_API_KEY)")
    q = sub.add_parser("ask", help="semantic search over embedded grants")
    q.add_argument("text"); q.add_argument("-k", type=int, default=5); q.add_argument("--state")
    sub.add_parser("stats")
    s = sub.add_parser("search", help="naive keyword check of what is stored")
    s.add_argument("text")
    args = p.parse_args()

    conn = db.connect()
    if args.cmd == "ingest":
        if args.source in ("seed", "all"):
            print("seed:", db.upsert_grants(conn, seed.load_seed()))
        if args.source in ("grants.gov-bulk", "all"):
            zip_path = grants_gov_bulk.download_latest()
            print("grants.gov-bulk:", db.upsert_grants(conn, list(grants_gov_bulk.iter_grants(zip_path))))
        if args.source == "grants.gov":  # keyword API, small; kept for quick refreshes
            grants = grants_gov.fetch_grants(per_query=args.per_query)
            print("grants.gov:", db.upsert_grants(conn, grants))
    elif args.cmd == "index":
        print(retrieval.index_grants(conn))
    elif args.cmd == "ask":
        for score, r in retrieval.search(conn, args.text, args.k, state=args.state):
            print(f"{score:.3f} [{r['deadline'] or 'rolling'}] {r['title']} ({r['funder']}) {r['url']}")
    elif args.cmd == "stats":
        for r in conn.execute("SELECT source, status, COUNT(*) n FROM grants GROUP BY 1,2"):
            print(f"{r['source']:12} {r['status']:11} {r['n']}")
        print("open & not expired:", len(db.open_grants(conn)))
    elif args.cmd == "search":
        words = args.text.lower().split()
        for r in db.open_grants(conn):
            blob = f"{r['title']} {r['description']}".lower()
            if all(w in blob for w in words):
                print(f"- [{r['deadline']}] {r['title']} ({r['funder']}) {r['url']}")


if __name__ == "__main__":
    main()
