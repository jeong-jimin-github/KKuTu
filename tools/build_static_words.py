#!/usr/bin/env python3
"""Build compact Korean + Japanese browser dictionaries for Static-KKuTu."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import urllib.request
import unicodedata
from pathlib import Path

DEFAULT_DB_URL = "https://raw.githubusercontent.com/JJoriping/KKuTu/master/db.sql"
DEFAULT_JMDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz"
KO_COPY_HEADER = "COPY kkutu_ko (_id, type, mean, hit, flag, theme) FROM stdin;"
KOR_GROUP = {"0", "1", "3", "7", "8", "11", "9", "16", "15", "17", "2", "18", "20", "26", "19", "INJEONG"}
JA_ID = re.compile(r"^[ぁ-ゖ一-龯々〆〇ー]+$")
JA_READING = re.compile(r"^[ぁ-ゖー]+$")


def download(url: str, user_agent: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read()


def read_source(path: Path | None, url: str, user_agent: str) -> bytes:
    return path.read_bytes() if path else download(url, user_agent)


def build_korean(sql_bytes: bytes) -> tuple[list[str], str]:
    sql = sql_bytes.decode("utf-8")
    start = sql.find(KO_COPY_HEADER)
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
        types = set(word_types.split(","))
        if word in seen or not (types & KOR_GROUP):
            continue
        if not word or word == r"\N" or "\n" in word or "\r" in word:
            continue
        try:
            flag = int(raw_flag or "0")
        except ValueError:
            flag = 0
        strict = bool(({"1", "INJEONG"} & types) and flag < 4)
        mask = (1 if flag & 2 else 0) | (2 if flag & 1 else 0) | (4 if strict else 0)
        words.append(word)
        meta.append(str(mask))
        seen.add(word)
    return words, "".join(meta)


def to_hiragana(text: str) -> str:
    text = unicodedata.normalize("NFKC", text.strip())
    out = []
    for ch in text:
        code = ord(ch)
        if 0x30A1 <= code <= 0x30F6:
            out.append(chr(code - 0x60))
        else:
            out.append(ch)
    return "".join(out)


def normalize_ja(text: str) -> str:
    # Mirrors Server/lib/const.js normalization for the characters used by JMdict.
    return re.sub(r"[^ぁ-ゖ一-龯々〆〇ー]", "", to_hiragana(text))


def xml_unescape(text: str) -> str:
    return (text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
            .replace("&quot;", '"').replace("&apos;", "'"))


def tags(xml: str, tag: str) -> list[str]:
    return [xml_unescape(v.strip()) for v in re.findall(rf"<{tag}(?:\s[^>]*)?>([\s\S]*?)</{tag}>", xml)]


def unique(items: list[str]) -> list[str]:
    return list(dict.fromkeys(item for item in items if item))


def build_japanese(jmdict_bytes: bytes) -> tuple[list[str], list[str]]:
    try:
        xml = gzip.decompress(jmdict_bytes).decode("utf-8")
    except (gzip.BadGzipFile, OSError):
        xml = jmdict_bytes.decode("utf-8")

    rows: dict[str, str] = {}
    for entry in re.findall(r"<entry>([\s\S]*?)</entry>", xml):
        readings = unique([normalize_ja(v) for v in tags(entry, "reb")])
        readings = [r for r in readings if len(r) >= 2 and JA_READING.fullmatch(r)]
        if not readings:
            continue
        # Keep the same alias policy as tools/import_jmdict.js used by the original server:
        # every reading is an ID, and normalized kanji forms use the entry's first reading.
        for reading in readings:
            rows.setdefault(reading, reading)
        for form in unique(tags(entry, "keb")):
            word = normalize_ja(form)
            if len(word) >= 2 and JA_ID.fullmatch(word):
                rows.setdefault(word, readings[0])

    words = sorted(rows)
    # Empty slots mean "reading equals word" and save several MB in the generated JS.
    readings = ["" if rows[word] == word else rows[word] for word in words]
    return words, readings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="local KKuTu db.sql; downloads upstream when omitted")
    parser.add_argument("--url", default=DEFAULT_DB_URL)
    parser.add_argument("--jmdict-input", type=Path, help="local JMdict_e.gz/XML; downloads JMdict when omitted")
    parser.add_argument("--jmdict-url", default=DEFAULT_JMDICT_URL)
    parser.add_argument("--output", type=Path, default=Path("static/word-data.js"))
    args = parser.parse_args()

    sql_bytes = read_source(args.input, args.url, "Static-KKuTu word builder")
    jmdict_bytes = read_source(args.jmdict_input, args.jmdict_url, "Static-KKuTu JMdict builder")
    ko_words, ko_meta = build_korean(sql_bytes)
    ja_words, ja_readings = build_japanese(jmdict_bytes)
    ko_digest = hashlib.sha256(sql_bytes).hexdigest()[:16]
    ja_digest = hashlib.sha256(jmdict_bytes).hexdigest()[:16]

    payload = (
        "// Generated from KKuTu db.sql (kkutu_ko) and JMdict/EDICT (kkutu_ja source). Do not edit by hand.\n"
        "window.KKUTU_STATIC_DB={"
        f"source:{json.dumps(args.url, ensure_ascii=False)},"
        f"sha256:{json.dumps(ko_digest)},count:{len(ko_words)},"
        f"words:{json.dumps(chr(10).join(ko_words), ensure_ascii=False, separators=(',', ':'))},"
        f"meta:{json.dumps(ko_meta)},"
        f"jaSource:{json.dumps(args.jmdict_url, ensure_ascii=False)},"
        f"jaSha256:{json.dumps(ja_digest)},jaCount:{len(ja_words)},"
        f"jaWords:{json.dumps(chr(10).join(ja_words), ensure_ascii=False, separators=(',', ':'))},"
        f"jaReadings:{json.dumps(chr(10).join(ja_readings), ensure_ascii=False, separators=(',', ':'))}"
        "};\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(payload, encoding="utf-8", newline="\n")
    print(
        f"generated {len(ko_words):,} Korean + {len(ja_words):,} Japanese aliases "
        f"-> {args.output} ({args.output.stat().st_size:,} bytes)"
    )


if __name__ == "__main__":
    main()
