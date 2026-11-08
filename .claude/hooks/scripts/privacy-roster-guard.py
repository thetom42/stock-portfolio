#!/usr/bin/env python3
"""Privacy adapter hook (UserPromptSubmit): block prompts that contain roster
clear names (real PII) before they reach a cloud assistant. Roster path is read
from .privacy.yaml; clear names are the roster keys. Exit 2 blocks the prompt.
No .privacy.yaml / roster, or roster unreadable => allow (exit 0)."""

# Annotations stay unevaluated, so `str | None` also loads on Python 3.9
# (macOS /usr/bin/python3); a TypeError there would exit 1 and fail open.
from __future__ import annotations

import json
import os
import re
import sys


def cfg_value(key: str, path: str = ".privacy.yaml") -> str | None:
    if not os.path.isfile(path):
        return None
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            m = re.match(r"^(\w[\w-]*):\s*(.+)$", raw.rstrip("\n"))
            if m and m.group(1) == key:
                return m.group(2).strip().strip('"').strip("'")
    return None


def names_word(name: str, text: str) -> bool:
    """name occurs in text as a whole word, ignoring case."""
    return re.search(r"\b" + re.escape(name) + r"\b", text, re.IGNORECASE) is not None


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except (OSError, ValueError):  # unreadable or not JSON: allow
        return 0
    prompt = str(data.get("prompt", "") or "")
    roster_path = cfg_value("roster")
    if not roster_path:
        return 0
    roster_path = os.path.expanduser(roster_path)
    if not os.path.isfile(roster_path):
        return 0
    try:
        with open(roster_path, encoding="utf-8") as fh:
            roster = json.load(fh)
        names: list[str] = [str(k) for k in roster] if isinstance(roster, dict) else []
    except (OSError, ValueError):  # roster unreadable or not JSON: allow
        return 0
    hits = sorted({n for n in names if n and names_word(n, prompt)})
    if hits:
        sys.stderr.write(
            f"Privacy: your prompt contains roster name(s): {', '.join(hits)}. "
            "Pseudonymize first "
            "(just scrub-clip, or just scrub <file>) before sending to a cloud "
            "assistant.\n"
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
