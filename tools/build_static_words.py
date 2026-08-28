#!/usr/bin/env python3
"""Convert KKuTu's PostgreSQL kkutu_ko COPY block into compact browser data."""

from __future__ import annotations

import argparse
import hashlib
import json
import urllib.request
from pathlib import Path

DEFAULT_DB_URL = "https://raw.githubusercontent.com/JJoriping/KKuTu/master/db.sql"
COPY_HEADER = "COPY kkutu_ko (_id, type, mean, hit, flag, theme) FROM stdin;"
KOR_GROUP = {"0", "1", "3", "7", "8", "11", "9", "16", "15", "17", "2", "18", "20", "26", "19", "INJEONG"}


def read_sql(path: Path | None, url: str) -> bytes:
    if path:
        return path.read_bytes()
    req = urllib.request.Request(url, headers={"User-Agent": "Static-KKuTu word builder"})
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read()


def build(sql_bytes: bytes) -> tuple[list[str], str]:
    sql = sql_bytes.decode("utf-8")
    start = sql.find(COPY_HEADER)
    if start < 0:
        raise RuntimeError("kkutu_ko COPY block not found")
    start = sql.find("\n", start) + 1
    end = sql.find(chr(10) + chr(92) + ".", start)
    if end < 0:
        raise RuntimeError("kkutu_ko COPY block terminator not found")

    words: list[str] = []
    meta: list[str] = []
    seen: set[str] = set()
    for line in sql[start:end].splitlines():
        cols = line.split("\t")
        if len(cols) < 6:
            continue
        word, word_types, _mean, _hit, raw_flag, _theme = cols[:6]
        if word in seen or not (set(word_types.split(",")) & KOR_GROUP):
            continue
        # COPY fields cannot contain a literal tab/newline; reject malformed IDs.
        if not word or word == r"\N" or "\n" in word or "\r" in word:
            continue
        try:
            flag = int(raw_flag or "0")
        except ValueError:
            flag = 0
        strict = bool(({"1", "INJEONG"} & set(word_types.split(","))) and flag < 4)
        mask = (1 if flag & 2 else 0) | (2 if flag & 1 else 0) | (4 if strict else 0)
        words.append(word)
        meta.append(str(mask))
        seen.add(word)
    return words, "".join(meta)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="local db.sql; downloads upstream when omitted")
    parser.add_argument("--url", default=DEFAULT_DB_URL)
    parser.add_argument("--output", type=Path, default=Path("static/word-data.js"))
    args = parser.parse_args()

    sql_bytes = read_sql(args.input, args.url)
    words, meta = build(sql_bytes)
    digest = hashlib.sha256(sql_bytes).hexdigest()[:16]
    payload = (
        "// Generated from JJoriping/KKuTu db.sql (kkutu_ko). Do not edit by hand.\n"
        "window.KKUTU_STATIC_DB={"
        f"source:{json.dumps(args.url, ensure_ascii=False)},"
        f"sha256:{json.dumps(digest)},count:{len(words)},"
        f"words:{json.dumps(chr(10).join(words), ensure_ascii=False, separators=(',', ':'))},"
        f"meta:{json.dumps(meta)}"
        "};\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(payload, encoding="utf-8", newline="\n")
    print(f"generated {len(words):,} playable Korean words -> {args.output} ({args.output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
