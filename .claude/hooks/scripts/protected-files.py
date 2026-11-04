#!/usr/bin/env python3
"""PreToolUse hook: block writes to protected files. Exit 2 blocks the tool.

Matching the raw file_path left three ways around the denylist (#468): a case
variant on a case-insensitive filesystem (.ENV is .env on APFS), a symlink or
`..` segment whose resolved target is protected, and NotebookEdit, whose
target is notebook_path. So the target is resolved first, then matched
case-insensitively, and a write tool that names no target is blocked rather
than let through.

A target inside the project is matched relative to the project root, so a
project that itself lives under a directory such as prod.app/ does not block
every write. The root is CLAUDE_PROJECT_DIR, else the nearest directory above
the session's cwd that holds .claude/, else the cwd -- never the cwd alone
when it is a subdirectory, or a session inside credentials/ would match
x.json instead of credentials/x.json. Whether a target is inside is asked of
the filesystem, so it ignores case exactly where the filesystem does.
A target outside the project is matched on its absolute path.
"""

import json
import os
import re
import sys
from typing import NoReturn

PATTERNS = [
    # Every basename that starts with .env (.env, .envrc, .env-prod, .env_local,
    # .envrc.local, the .env/ directory), deliberately over-inclusive (#362),
    # plus a .env suffix or infix (app.env, config.env.local).
    r"(^|/)\.env",
    r"(^|/)[^/]*\.env($|[./])",
    r"(^|/)credentials/",
    r"(^|/)secrets/",
    r"(^|/)api-keys\.",
    r"(^|/)production\.",
    r"(^|/)prod\.",
    r"(^|/)migrations/",
    r"(^|/)\.git/",
]


def block(reason: str) -> NoReturn:
    print(f"BLOCKED by protected-files: {reason}", file=sys.stderr)
    sys.exit(2)


def find_root(cwd: str) -> str:
    """The project root: CLAUDE_PROJECT_DIR, else the nearest .claude/ above cwd."""
    env_root = os.environ.get("CLAUDE_PROJECT_DIR")
    if env_root:
        return env_root
    path = os.path.abspath(cwd)
    while True:
        if os.path.isdir(os.path.join(path, ".claude")):
            return path
        parent = os.path.dirname(path)
        if parent == path:
            return os.path.abspath(cwd)
        path = parent


def inside(path: str, root: str) -> "str | None":
    """path relative to root when it lies within it, else None.

    The filesystem decides, not the spelling: the deepest existing ancestor of
    path must be root itself or below it (os.path.samefile). So a case variant
    of the root is inside on a case-insensitive filesystem such as APFS, and a
    different directory on a case-sensitive one, where its whole path counts.
    """
    if not os.path.exists(root):
        return None
    parts: list[str] = []
    probe = path
    while not os.path.exists(probe):
        parent = os.path.dirname(probe)
        if parent == probe:
            return None
        parts.append(os.path.basename(probe))
        probe = parent
    while True:
        if os.path.samefile(probe, root):
            return "/".join(reversed(parts)) or None
        parent = os.path.dirname(probe)
        if parent == probe:
            return None
        parts.append(os.path.basename(probe))
        probe = parent


def candidates(target: str, cwd: str, root: str) -> list[str]:
    """The forms of target to match: as written, and as resolved."""
    joined = os.path.normpath(os.path.join(cwd, target))
    resolved = os.path.realpath(os.path.join(cwd, target))
    forms: list[str] = []
    for path, base in (
        (joined, os.path.normpath(root)),
        (resolved, os.path.realpath(root)),
    ):
        rel = inside(path, base)
        forms.append(rel if rel else path.replace(os.sep, "/"))
    return forms


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except ValueError:
        block("the hook input is not valid JSON")
    tool_input = data.get("tool_input") or {}
    target = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    if not target:
        tool = data.get("tool_name") or "the tool"
        block(f"{tool} names no file, so it cannot be checked")
    cwd = data.get("cwd") or os.getcwd()
    for form in candidates(target, cwd, find_root(cwd)):
        for pattern in PATTERNS:
            if re.search(pattern, form, re.IGNORECASE):
                block(
                    f"{target} is a protected file ({form}); "
                    "ask the user before changing it"
                )
    sys.exit(0)


if __name__ == "__main__":
    main()
