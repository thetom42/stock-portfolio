#!/usr/bin/env bash
set -euo pipefail

# Block unfiltered environment variable dumps that could expose secrets.
# Allows targeted checks like: echo "$VAR", printenv VAR, env VAR=val cmd
# Blocks: printenv, env, set, export and declare without a name, wherever the
# shell would run them as a command (#417):
#   - behind a path, assignments, keywords or wrappers: /usr/bin/env,
#     FOO=1 env, ! env, if x; then env; fi, nice -n 5 env, sudo -u root env
#   - as the program env, eval or a shell runs: env printenv, bash -c env,
#     eval env, bash <<EOF with env in the body
#   - inside a command substitution: echo $(env), and $(which env) as the
#     command word, which cannot be resolved statically
# Not checked: single-quoted text and here-document bodies that only feed
# data (they are not run), a command piped into a shell (echo env | bash),
# ANSI-C escapes in the command word ($'e\x6ev'), `case` patterns inside
# $(...), and bash's fallback from (( to nested subshells.
# The command line is read by a small shell lexer below. Anything it cannot
# read (an unclosed quote, nesting too deep, an internal error) blocks.
#
# This is a seatbelt against accidental dumps, not a boundary against an agent
# that is trying to get around it: the shell's grammar is larger than any
# check of its text. The boundary is that no token sits in the agent's
# environment at all (#426, #472).

input=$(cat)
# Without python3 the hook cannot parse the command and allows it, as before.
command -v python3 >/dev/null 2>&1 || exit 0

python3 - "$input" <<'PY' && exit 0
import json
import os
import re
import sys

try:
    cmd = json.loads(sys.argv[1]).get("tool_input", {}).get("command", "")
except (ValueError, AttributeError):
    sys.exit(0)
if not isinstance(cmd, str):
    sys.exit(0)

MAX_DEPTH = 6
DUMPERS = {"printenv", "env", "set", "export", "declare", "typeset"}
# Words that may stand before the command word without being it.
KEYWORDS = {"!", "{", "}", "if", "then", "else", "elif", "while", "until", "do"}
# Programs that run their arguments as a command: options that take a value,
# and how many positional operands come before the command (timeout DUR).
WRAPPERS = {
    "command": ({}, 0),
    "builtin": ({}, 0),
    "exec": ({"-a"}, 0),
    "nohup": ({}, 0),
    "time": ({"-o", "-f", "--output", "--format"}, 0),
    "nice": ({"-n", "--adjustment"}, 0),
    "sudo": ({"-u", "-g", "-h", "-p", "-C", "-U", "-r", "-t", "-T", "-D",
              "--user", "--group", "--host", "--prompt", "--close-from",
              "--other-user", "--role", "--type", "--command-timeout", "--chdir"}, 0),
    "timeout": ({"-s", "-k", "--signal", "--kill-after"}, 1),
    "xargs": ({"-I", "-J", "-R", "-S", "-d", "-E", "-L", "-n", "-P", "-s", "-a",
               "--delimiter", "--max-args", "--max-procs", "--arg-file",
               "--max-chars", "--process-slot-var"}, 0),
    "stdbuf": ({"-i", "-o", "-e", "--input", "--output", "--error"}, 0),
    "watch": ({"-n", "--interval"}, 0),
}
SHELLS = {"sh", "bash", "zsh", "dash", "ksh"}
SHELL_VALUE_OPTS = {"-o", "+o", "-O", "+O", "--rcfile", "--init-file"}
# GNU and BSD (macOS) env options that take a value.
ENV_VALUE_OPTS = {"-u", "--unset", "-C", "--chdir", "-P", "-a", "--argv0"}
ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\[[^]]*\])?\+?=")
# Longest first, so "&&(" lexes as "&&" then "(".
OPERATORS = sorted(["<<<", "<<-", "&>>", ";;&", ";;", ";&", "&&", "||", "|&", "<<",
                    ">>", "<&", ">&", "<>", "&>", ">|", "<(", ">(", ";", "&", "|",
                    "(", ")", "<", ">"], key=len, reverse=True)
REDIRECTS = {"<", ">", ">>", "<&", ">&", "<>", "&>", "&>>", ">|", "<<<"}
SEPARATORS = {";", "&", "&&", "||", "|", "|&", ";;", ";;&", ";&", "(", ")", "<(", ">(", "\n"}
META = set(" \t\n;&|()<>")


class Unreadable(Exception):
    pass


HEREDOC_START = re.compile(r"<<(-?)[ \t]*(\"[^\"\n]*\"|'[^'\n]*'|[^\s;&|()<>]+)")


def skip_heredoc_bodies(text, i, pending):
    """At the newline at i, skip the bodies of the pending here-documents."""
    n = len(text)
    i += 1
    for strip_tabs, delim in pending:
        while i < n:
            j = text.find("\n", i)
            line_end = n if j < 0 else j
            line = text[i:line_end]
            i = line_end + 1 if j >= 0 else n
            if (line.lstrip("\t") if strip_tabs else line) == delim:
                break
    pending.clear()
    return i


def close_paren(text, i):
    """Index just past the ) that closes the $( or ( whose content starts at i.

    Here-document bodies inside, as in $(cat <<'EOF' ... EOF), are skipped:
    their quotes and parentheses are data."""
    depth, n, pending = 1, len(text), []
    while i < n:
        c = text[i]
        if c == "\\":
            i += 2
            continue
        if c == "\n" and pending:
            i = skip_heredoc_bodies(text, i, pending)
            continue
        if text.startswith("<<", i) and not text.startswith("<<<", i):
            m = HEREDOC_START.match(text, i)
            if m:
                delim = re.sub(r"[\"'\\]", "", m.group(2))
                pending.append((m.group(1) == "-", delim))
                i = m.end()
                continue
        if c == "'":
            j = text.find("'", i + 1)
            if j < 0:
                raise Unreadable
            i = j + 1
            continue
        if c == '"':
            i = close_double(text, i + 1)
            continue
        if c == "`":
            j = text.find("`", i + 1)
            if j < 0:
                raise Unreadable
            i = j + 1
            continue
        if c == "#" and (i == 0 or text[i - 1] in META):
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise Unreadable


def close_double(text, i):
    """Index just past the " that closes a double-quoted string at i."""
    n = len(text)
    while i < n:
        c = text[i]
        if c == "\\":
            i += 2
        elif c == '"':
            return i + 1
        elif text.startswith("$(", i):
            i = close_paren(text, i + 2)
        elif c == "`":
            j = text.find("`", i + 1)
            if j < 0:
                raise Unreadable
            i = j + 1
        else:
            i += 1
    raise Unreadable


def close_brace(text, i):
    """Index just past the } that closes a ${ whose content starts at i."""
    depth, n = 1, len(text)
    while i < n:
        c = text[i]
        if c == "\\":
            i += 2
            continue
        if c == "'":
            j = text.find("'", i + 1)
            i = n if j < 0 else j + 1
            continue
        if c == '"':
            i = close_double(text, i + 1)
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise Unreadable


def substitutions_in(text, i, j, out):
    """Collect the $(...) and `...` bodies the shell would run in text[i:j],
    reading it as an unquoted here-document body: quotes are literal there."""
    while i < j:
        c = text[i]
        if c == "\\":
            i += 2
        elif text.startswith("$((", i):
            # Arithmetic runs the substitutions inside it: $(( $(env) )).
            end = close_paren(text, i + 3) + 1
            substitutions_in(text, i + 3, end - 2, out)
            i = end
        elif text.startswith("$(", i):
            end = close_paren(text, i + 2)
            out.append(text[i + 2:end - 1])
            i = end
        elif c == "`":
            end = text.find("`", i + 1)
            if end < 0:
                raise Unreadable
            out.append(text[i + 1:end])
            i = end + 1
        else:
            i += 1


def lex(text):
    """Tokens of a command line: ("op", s), ("word", s) and ("doc", n) for the
    n-th here-document. Returns tokens, substitution bodies by placeholder,
    and the here-documents as (body, quoted)."""
    toks, subs, docs, pending = [], {}, [], []
    i, n = 0, len(text)

    def word(i):
        """Read one word at i; returns (quote-removed text, raw, next i)."""
        out, start = [], i
        while i < n and text[i] not in META:
            c = text[i]
            if c == "\\":
                if i + 1 < n and text[i + 1] == "\n":
                    i += 2  # line continuation
                    continue
                out.append(text[i + 1:i + 2])
                i += 2
            elif text.startswith("$'", i):
                # ANSI-C quoting: backslash escapes, \' does not end it.
                j = i + 2
                while j < n and text[j] != "'":
                    j += 2 if text[j] == "\\" else 1
                if j >= n:
                    raise Unreadable
                out.append(text[i + 2:j])
                i = j + 1
            elif text.startswith('$"', i):
                i += 1  # locale quoting: read as a double-quoted string
            elif c == "'":
                j = text.find("'", i + 1)
                if j < 0:
                    raise Unreadable
                out.append(text[i + 1:j])
                i = j + 1
            elif c == '"':
                j = close_double(text, i + 1)
                inner = text[i + 1:j - 1]
                out.append(placeholders(inner))
                i = j
            elif text.startswith("$((", i):
                j = close_paren(text, i + 3) + 1
                inner_subs(text, i + 3, j - 2)
                out.append(text[i:j])
                i = j
            elif text.startswith("$(", i):
                j = close_paren(text, i + 2)
                out.append(placeholder(text[i + 2:j - 1]))
                i = j
            elif c == "`":
                j = text.find("`", i + 1)
                if j < 0:
                    raise Unreadable
                out.append(placeholder(text[i + 1:j]))
                i = j + 1
            elif text.startswith("${", i):
                j = close_brace(text, i + 2)
                inner_subs(text, i + 2, j - 1)  # ${X:-$(env)} runs it
                out.append(text[i:j])
                i = j
            else:
                out.append(c)
                i += 1
        return "".join(out), text[start:i], i

    def placeholder(body):
        key = f"__subst{len(subs)}__"
        subs[key] = body
        return key

    def inner_subs(text, i, j):
        """Register the substitutions inside an expansion: they run as well."""
        found = []
        substitutions_in(text, i, j, found)
        for b in found:
            placeholder(b)

    def placeholders(inner):
        """Substitutions inside a double-quoted string, as placeholders."""
        found = []
        substitutions_in(inner, 0, len(inner), found)
        return " ".join(placeholder(b) for b in found) if found else inner

    while i < n:
        c = text[i]
        if c in " \t":
            i += 1
            continue
        if c == "\n":
            toks.append(("op", "\n"))
            i += 1
            for strip_tabs, delim, quoted in pending:
                start = i
                while i < n:
                    j = text.find("\n", i)
                    line_end = n if j < 0 else j
                    line = text[i:line_end]
                    if (line.lstrip("\t") if strip_tabs else line) == delim:
                        docs.append((text[start:i], quoted))
                        i = line_end + 1 if j >= 0 else n
                        break
                    i = line_end + 1 if j >= 0 else n
                else:
                    docs.append((text[start:n], quoted))
            pending = []
            continue
        if c == "#":
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        if text.startswith("((", i):
            # An arithmetic command: (( x << 2 )) holds no here-document.
            j = close_paren(text, i + 2) + 1
            inner_subs(text, i + 2, j - 2)
            toks.append(("word", text[i:j]))
            i = j
            continue
        op = next((o for o in OPERATORS if text.startswith(o, i)), None)
        if op:
            i += len(op)
            if op in ("<<", "<<-"):
                while i < n and text[i] in " \t":
                    i += 1
                delim, raw, i = word(i)
                pending.append((op == "<<-", delim, any(q in raw for q in "'\"\\")))
                toks.append(("doc", len(docs) + len(pending) - 1))
            else:
                toks.append(("op", op))
            continue
        w, raw, i = word(i)
        if raw.replace("\\\n", ""):
            toks.append(("word", w))  # a bare line continuation is no word
    # A here-document whose body never started (no newline after it) is empty.
    docs.extend(("", quoted) for _, _, quoted in pending)
    return toks, subs, docs


def commands(toks):
    """Simple commands as (words, inputs): an input is a here-document number
    or ("string", text) for a here-string."""
    cur, cur_docs, i = [], [], 0
    while i < len(toks):
        kind, val = toks[i]
        if kind == "doc":
            cur_docs.append(val)
        elif kind == "op" and val in SEPARATORS:
            if cur or cur_docs:
                yield cur, cur_docs
            cur, cur_docs = [], []
        elif kind == "op" and val == "<<<":
            # A here-string is the command's input, like a here-document.
            if i + 1 < len(toks) and toks[i + 1][0] == "word":
                cur_docs.append(("string", toks[i + 1][1]))
            i += 1
        elif kind == "op" and val in REDIRECTS:
            i += 1  # the operand: a file, a descriptor or a word
        elif kind == "word":
            nxt = toks[i + 1] if i + 1 < len(toks) else None
            if val.isdigit() and nxt and nxt[0] == "op" and nxt[1] in REDIRECTS:
                pass  # the 2 of 2>&1
            else:
                cur.append(val)
        i += 1
    if cur or cur_docs:
        yield cur, cur_docs


def skip_options(args, value_opts):
    """Index of the first argument after the options, honouring values."""
    j = 0
    while j < len(args):
        a = args[j]
        if a == "--":
            return j + 1
        if not a.startswith("-") or a == "-":
            return j
        if a.startswith("--") and "=" in a:
            j += 1
        elif a in value_opts:
            j += 2
        else:
            j += 1  # a flag, or a value attached as in -n5
    return j


class Context:
    def __init__(self, subs, docs, depth):
        self.subs, self.docs, self.depth = subs, docs, depth

    def input_text(self, d):
        return d[1] if isinstance(d, tuple) else self.docs[d][0]

    def names_dumper(self, key):
        """A substitution whose words name a dumper (which env) counts as it."""
        return any(k == "word" and os.path.basename(v) in DUMPERS for k, v in lex(self.subs[key])[0])

    def shell_string(self, text):
        """A string a shell or eval runs: its substitutions count as for eval."""
        return any(k in text and self.names_dumper(k) for k in self.subs) or check(text, self.depth + 1)


def dumps(words, docs, ctx):
    """True when this simple command prints the environment unfiltered."""
    i = 0
    while i < len(words):
        w = words[i]
        if ASSIGN.match(w) or w in KEYWORDS:
            i += 1
            continue
        if w == "function":
            i += 2  # function NAME { ... }: the body follows as its own command
            continue
        if w in ctx.subs:
            # The command word is a substitution: its output is the program.
            # A substitution that names a dumper (which env) counts as it. If
            # it expands to nothing ($(true) env), the next word is the command.
            return ctx.names_dumper(w) or dumps(words[i + 1:], docs, ctx)
        if w.startswith("$"):
            # An expansion as the command word: if it is empty ($SUDO env), the
            # shell drops it and the next word is the command.
            if dumps(words[i + 1:], docs, ctx):
                return True
        name = os.path.basename(w)
        args = words[i + 1:]
        if name in ("command", "type") and args and args[0] in ("-v", "-V"):
            return False  # a lookup, not a run
        if name == "time" and args and args[0] == "-p":
            args = args[1:]
        if name in WRAPPERS:
            value_opts, positional = WRAPPERS[name]
            j = skip_options(args, value_opts) + positional
            if name == "xargs" and docs:
                # xargs appends the words of its input to the command it runs
                # (xargs sh -c <<< env runs sh -c env), or with -I/-J/--replace
                # puts the input in place of the placeholder.
                cmd = args[j:] or ["echo"]
                marks = {args[k + 1] for k, a in enumerate(args[:j])
                         if a in ("-I", "-J") and k + 1 < len(args)}
                marks |= {a[2:] for a in args[:j] if a[:2] in ("-I", "-J", "-i") and len(a) > 2}
                marks |= {a.partition("=")[2] or "{}" for a in args[:j] if a.startswith("--replace")}
                marks |= {"{}" for a in args[:j] if a == "-i"}
                for d in docs:
                    text = ctx.input_text(d)
                    # Replace mode runs the command once per input line.
                    for item in (text.splitlines() if marks else []):
                        line = cmd
                        for m in marks:
                            line = [w.replace(m, item.strip()) for w in line]
                        if dumps(line, [], ctx):
                            return True
                    if dumps(cmd + text.split(), [], ctx):
                        return True
            return dumps(args[j:], docs, ctx) if j < len(args) else False
        if name == "eval":
            # eval re-reads its words: as words (eval $(which env)) and as a line.
            return dumps(args, docs, ctx) or ctx.shell_string(" ".join(args))
        if name in SHELLS:
            has_c = has_s = from_stdin = False
            j = 0
            while j < len(args):
                a = args[j]
                if a in SHELL_VALUE_OPTS:
                    j += 2
                    continue
                if a == "--":
                    j += 1
                    break
                if a == "-":
                    from_stdin = True  # a lone - ends the options; stdin follows
                    j += 1
                    break
                if a[:1] in ("-", "+") and len(a) > 1:
                    if a[:1] == "-" and not a.startswith("--"):
                        has_c = has_c or "c" in a[1:]
                        has_s = has_s or "s" in a[1:]
                    # -euo pipefail, -oc pipefail env: every o or O in a cluster
                    # takes the next word as its value, like a standalone -o.
                    j += 1 + (0 if a.startswith("--") else sum(ch in "oO" for ch in a[1:]))
                    continue
                break
            rest = args[j:]
            if has_c:
                return bool(rest) and ctx.shell_string(rest[0])
            if rest and not (has_s or from_stdin):
                return False  # a script file, which the hook cannot read
            # The shell reads its input: a here-document or here-string runs as
            # commands. -s makes the remaining words positional parameters.
            return any(ctx.shell_string(d[1]) if isinstance(d, tuple)
                       else check(ctx.input_text(d), ctx.depth + 1) for d in docs)
        if name == "env":
            j = 0
            while j < len(args):
                a = args[j]
                if a in ("-S", "--split-string") and j + 1 < len(args):
                    return ctx.shell_string(args[j + 1])
                if a in ENV_VALUE_OPTS:
                    j += 2
                elif a.startswith("-") or ASSIGN.match(a):
                    j += 1
                else:
                    break
            return True if j >= len(args) else dumps(args[j:], docs, ctx)
        if name in ("printenv", "export", "declare", "typeset"):
            return not any(not a.startswith("-") for a in args)
        if name == "set":
            return not args
        return False
    return False


def check(text, depth=0):
    if depth > MAX_DEPTH:
        return True  # too deep to tell: fail closed
    toks, subs, docs = lex(text)
    ctx = Context(subs, docs, depth)
    for words, cmd_docs in commands(toks):
        if dumps(words, cmd_docs, ctx):
            return True
    # Commands inside substitutions run too: $(env) dumps as well, also from
    # an unquoted here-document body, where quotes are literal text.
    nested = list(subs.values())
    for body, quoted in docs:
        if not quoted:
            substitutions_in(body, 0, len(body), nested)
    return any(check(t, depth + 1) for t in nested)


try:
    blocked = check(cmd)
except (Unreadable, RecursionError, IndexError, ValueError):
    blocked = True  # the lexer could not read it: fail closed
sys.exit(1 if blocked else 0)
PY
echo "BLOCKED: Unfiltered environment dump detected. Use 'echo \"\$VAR_NAME\"' or 'printenv VAR_NAME' to check specific variables." >&2
exit 2
