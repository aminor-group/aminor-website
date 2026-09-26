#!/usr/bin/env python3
"""Add new papers to data/publications.yaml from OpenAlex.

Google Scholar has no API, so new papers come from OpenAlex (free, no key needed
for light use), matched on Andy Minor's ORCID. Existing entries are never changed
or removed; new ones are inserted in year order and printed so you can review them.

    python3 scripts/update_publications.py              # papers from the last 2 years
    python3 scripts/update_publications.py --since 2020
    python3 scripts/update_publications.py --dry-run    # show what would be added

Requires PyYAML:  pip install pyyaml
Optional: set OPENALEX_API_KEY if OpenAlex asks for a key.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ORCID = "0000-0003-3606-8309"          # Andrew M. Minor
DATA = Path(__file__).resolve().parent.parent / "data" / "publications.yaml"
API = "https://api.openalex.org/works"
MAX_AUTHORS = 8                          # longer author lists end with "..."


def norm_title(t):
    return re.sub(r"[^a-z0-9]", "", (t or "").lower())


def short_name(full):
    """'Andrew M. Minor' -> 'AM Minor' (the Google Scholar style used in the list)."""
    parts = full.replace(".", " ").split()
    if len(parts) < 2:
        return full
    initials = "".join(p[0] for p in parts[:-1] if p[0].isalpha()).upper()
    return f"{initials} {parts[-1]}"


def to_entry(w):
    """OpenAlex work -> publications.yaml entry."""
    loc = w.get("primary_location") or {}
    src = (loc.get("source") or {}).get("display_name") or ""
    b = w.get("biblio") or {}
    venue = src
    if b.get("volume"):
        venue += f" {b['volume']}"
        if b.get("issue"):
            venue += f" ({b['issue']})"
    if b.get("first_page"):
        pages = b["first_page"] + (f"-{b['last_page']}" if b.get("last_page") and b["last_page"] != b["first_page"] else "")
        venue += f", {pages}"
    year = w.get("publication_year")
    if year:
        venue = f"{venue}, {year}" if venue else str(year)

    names = [short_name(a["author"]["display_name"]) for a in w.get("authorships", [])]
    authors = ", ".join(names[:MAX_AUTHORS]) + (", ..." if len(names) > MAX_AUTHORS else "")

    kind = {"article": "article", "review": "article", "letter": "article",
            "preprint": "preprint"}.get(w.get("type"), "other")
    # Microscopy and Microanalysis conference abstracts appear as articles in a supplement.
    if kind == "article" and "Microscopy and Microanalysis" in src and "S" in str(b.get("issue") or ""):
        kind = "abstract"

    e = {"title": re.sub(r"\s+", " ", w.get("title") or "").strip()}
    if authors:
        e["authors"] = authors
    if venue:
        e["venue"] = venue
    if year:
        e["year"] = year
    e["type"] = kind
    if w.get("doi"):
        e["doi"] = w["doi"].replace("https://doi.org/", "")
    return e


def fetch(since):
    params = {
        "filter": f"authorships.author.orcid:{ORCID},from_publication_date:{since}-01-01",
        "per-page": "200",
        "cursor": "*",
        "select": "doi,title,publication_year,type,primary_location,biblio,authorships",
        "mailto": "aminor@berkeley.edu",
    }
    if os.environ.get("OPENALEX_API_KEY"):
        params["api_key"] = os.environ["OPENALEX_API_KEY"]
    works = []
    while params["cursor"]:
        url = API + "?" + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url, timeout=60) as r:
            page = json.load(r)
        works += page["results"]
        params["cursor"] = page["meta"].get("next_cursor")
    return works


def load():
    """Return (comment header at the top of the file, list of entries)."""
    text = DATA.read_text(encoding="utf-8")
    header = []
    for line in text.splitlines(keepends=True):
        if not line.startswith("#"):
            break
        header.append(line)
    return "".join(header), yaml.safe_load(text) or []


def save(header, pubs):
    body = yaml.safe_dump(pubs, sort_keys=False, allow_unicode=True, width=4000)
    DATA.write_text(header + "\n" + body, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--since", type=int, default=dt.date.today().year - 1, help="first publication year to check")
    ap.add_argument("--dry-run", action="store_true", help="print new papers without writing")
    ap.add_argument("--from-file", help=argparse.SUPPRESS)  # saved OpenAlex response, for testing offline
    args = ap.parse_args()

    header, pubs = load()
    have_doi = {(p.get("doi") or "").lower() for p in pubs if p.get("doi")}
    have_title = {norm_title(p["title"]) for p in pubs}

    works = json.load(open(args.from_file))["results"] if args.from_file else fetch(args.since)
    new = []
    for w in works:
        e = to_entry(w)
        if not e["title"] or (e.get("doi") or "").lower() in have_doi or norm_title(e["title"]) in have_title:
            continue
        have_title.add(norm_title(e["title"]))
        new.append(e)

    if not new:
        print(f"No new papers since {args.since} ({len(works)} checked).")
        return
    print(f"{len(new)} new paper(s):")
    for e in new:
        print(f"  [{e['type']}] {e.get('year')}  {e['title']}\n           {e.get('venue', '')}")
    if args.dry_run:
        return

    # Insert each new entry before the first existing entry from an earlier year.
    for e in sorted(new, key=lambda e: e.get("year") or 0, reverse=True):
        y = e.get("year") or 0
        i = next((k for k, p in enumerate(pubs) if (p.get("year") or 0) < y), len(pubs))
        pubs.insert(i, e)
    save(header, pubs)
    print(f"Wrote {DATA.relative_to(DATA.parent.parent)}. Check the entries (type, title) before committing.")


if __name__ == "__main__":
    sys.exit(main())
