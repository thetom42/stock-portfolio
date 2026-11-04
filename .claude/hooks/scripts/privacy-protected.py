#!/usr/bin/env python3
"""Privacy adapter hook (PreToolUse): block direct read/edit/write of
privacy-protected surfaces. Protected globs are read from .privacy.yaml; access
to those paths is allowed only via the scrub recipes. Exit 2 blocks the tool.
No .privacy.yaml or no 'protected:' list => allow (exit 0)."""

import json
import os
import re
import sys


def load_protected(path: str = ".privacy.yaml") -> list[str]:
    globs: list[str] = []
    if not os.path.isfile(path):
        return globs
    in_protected = False
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if re.match(r"^protected:\s*$", line):
                in_protected = True
                continue
            m = re.match(r"^\s*-\s*(.+)$", line)
            if in_protected and m:
                globs.append(m.group(1).strip().strip('"').strip("'"))
                continue
            if re.match(r"^\S", line):  # any next top-level key ends the list
                in_protected = False
    return globs


def glob_to_re(glob: str) -> re.Pattern[str]:
    out: list[str] = []
    i = 0
    while i < len(glob):
        if glob[i : i + 2] == "**":
            out.append(".*")
            i += 2
            if i < len(glob) and glob[i] == "/":
                i += 1
        elif glob[i] == "*":
            out.append("[^/]*")
            i += 1
        elif glob[i] == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(glob[i]))
            i += 1
    return re.compile("(^|/)" + "".join(out) + "$")


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    path = (data.get("tool_input") or {}).get("file_path", "")
    if not path or not isinstance(path, str):
        return 0
    for glob in load_protected():
        if glob_to_re(glob).search(path):
            sys.stderr.write(
                f"Privacy: '{path}' is a protected surface (.privacy.yaml). Access it "
                "only via the scrub recipes (just scrub / just privacy-check) — "
                "never read it directly into the session.\n"
            )
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
