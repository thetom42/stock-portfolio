#!/usr/bin/env bash
set -euo pipefail

# Invoke one or more configured AI assistants headlessly for MR code review.
#
# Arg 1 may be a single bot name or a comma-separated list (e.g. "codex,opencode").
# Each reviewer runs independently and posts its own attributed MR note. Running
# two reviewers with different model priors catches more real bugs than one, since
# a single model is biased toward its own idioms. The orchestrating harness then
# aggregates, deduplicates and verifies the findings across notes before fixing
# (the driver-side "meta-review" step is documented in the bot-review skill).
#
# A single bot behaves exactly as before (one note, same output).

# codex exec reads the prompt from stdin whenever stdin is open and waits for
# EOF, even though the prompt is already in argv. Started from an agent session
# or any caller whose stdin never closes, it waits forever. Closing stdin once,
# here, means no branch below and no caller can reintroduce that (Foreman #56;
# lost on the way into this shared copy, see #449).
exec </dev/null

# The caller's exported environment as it was before this script assigned
# anything: a reviewer's conf line may name variables to pass through (the
# sixth field, see review_with_bot), and those must be the caller's values.
# Read later, an exported name the script reassigns (a local GLAB_CONFIG_DIR,
# BRANCH, MODEL) would report the script's value instead.
# env -0 is started on fd 3 first, so even CALLER_ENV and _kv themselves are
# captured before they are assigned.
exec 3< <(env -0)
CALLER_ENV=()
while IFS= read -r -d '' -u 3 _kv; do
    CALLER_ENV+=("$_kv")
done
exec 3<&-
unset _kv

BOT_NAMES_RAW="${1:?Usage: bot-review.sh <bot-name[,bot-name...]> <mr-iid> [review-round] [model]}"
MR_IID="${2:?Usage: bot-review.sh <bot-name[,bot-name...]> <mr-iid> [review-round] [model]}"
REVIEW_ROUND="${3:-1}"
MODEL="${4:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# --- Shared, bot-independent discovery -------------------------------------

BOT_CONFIG=""
for candidate in \
    "$PROJECT_ROOT/.ai-harness/review-bots.conf" \
    "$PROJECT_ROOT/.claude/review-bots.conf" \
    "$PROJECT_ROOT/ai-harness/review-bots.conf" \
    "$PROJECT_ROOT/claude-code/review-bots.conf"; do
    if [[ -f "$candidate" ]]; then
        BOT_CONFIG="$candidate"
        break
    fi
done

if [[ -z "$BOT_CONFIG" ]]; then
    echo "Error: review-bots.conf not found" >&2
    exit 1
fi

PROMPT_TEMPLATE=""
for candidate in \
    "$PROJECT_ROOT/.ai-harness/prompts/mr-review.md" \
    "$PROJECT_ROOT/.claude/prompts/codex-review.md" \
    "$PROJECT_ROOT/ai-harness/prompts/mr-review.md" \
    "$PROJECT_ROOT/claude-code/prompts/codex-review.md"; do
    if [[ -f "$candidate" ]]; then
        PROMPT_TEMPLATE="$candidate"
        break
    fi
done

if [[ -z "$PROMPT_TEMPLATE" ]]; then
    echo "Error: review prompt template not found" >&2
    exit 1
fi

BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current)
LAST_COMMIT=$(git -C "$PROJECT_ROOT" log -1 --format="%h")
HEAD_SHA=$(git -C "$PROJECT_ROOT" rev-parse HEAD)

# Set REVIEW_SCOPE=full to review the whole MR diff in a round >= 2, e.g. after
# a round that was void (wrong ref, wrong bot, aborted run). Otherwise a
# follow-up round covers every commit since this reviewer's last posted review.
REVIEW_SCOPE_MODE="${REVIEW_SCOPE:-auto}"

# --- Reviewer environment --------------------------------------------------
#
# The reviewer is a model with shell access whose output is posted verbatim, so
# it starts from an empty environment plus an allowlist instead of the caller's
# full one (#457). A denylist only withholds what it was told about: the
# caller's GITLAB_TOKEN_<BOT> variables, OAUTH_TOKEN or GITLAB_HOST would all
# have reached it. glab, given no config dir, also falls back to the operator's
# own config file and keyring, which is how a reviewer once posted as the repo
# owner (Foreman #86/#90). So the config, cache, data and state locations point
# into a scratch directory that holds nothing and is removed on exit.
#
# This closes the accidental path, not a deliberate one: the reviewer keeps
# HOME, where its own subscription credential lives, and could still point
# glab at the operator's config on purpose (#472). A missing allowlist entry
# makes the reviewer fail loudly; a missing denylist entry made it post as
# someone else. A reviewer that needs more (an API key, its XDG login) names
# those variables in its conf line's sixth field, see review_with_bot.
REVIEWER_SCRATCH=$(mktemp -d "${TMPDIR:-/tmp}/bot-review-scratch-XXXXXX")
trap 'rm -rf "$REVIEWER_SCRATCH"' EXIT
mkdir -p "$REVIEWER_SCRATCH"/glab "$REVIEWER_SCRATCH"/config \
    "$REVIEWER_SCRATCH"/cache "$REVIEWER_SCRATCH"/data "$REVIEWER_SCRATCH"/state
REVIEWER_ENV=(
    env -i
    "PATH=$PATH"
    "HOME=$HOME"
    "USER=${USER:-$(id -un)}"
    "LOGNAME=${LOGNAME:-${USER:-$(id -un)}}"
    "GLAB_CONFIG_DIR=$REVIEWER_SCRATCH/glab"
    "XDG_CONFIG_HOME=$REVIEWER_SCRATCH/config"
    "XDG_CACHE_HOME=$REVIEWER_SCRATCH/cache"
    "XDG_DATA_HOME=$REVIEWER_SCRATCH/data"
    "XDG_STATE_HOME=$REVIEWER_SCRATCH/state"
    "TMPDIR=${TMPDIR:-/tmp}"
    "TERM=${TERM:-dumb}"
    "LANG=${LANG:-C.UTF-8}"
    "LC_ALL=${LC_ALL:-${LANG:-C.UTF-8}}"
)

# --- Time limit ------------------------------------------------------------
#
# A reviewer that hangs (waiting on input, the network or a shed request) would
# otherwise run for hours while the caller waits for output that never comes
# (#439). Each run gets REVIEW_TIMEOUT seconds; a real review took up to about
# 20 minutes on the reference MRs, so the default leaves room. The watchdog is
# plain bash because `timeout` is not on a stock macOS.
REVIEW_TIMEOUT="${REVIEW_TIMEOUT:-1800}"
if [[ ! "$REVIEW_TIMEOUT" =~ ^[1-9][0-9]*$ ]]; then
    echo "Error: REVIEW_TIMEOUT must be a positive number of seconds, got '$REVIEW_TIMEOUT'" >&2
    exit 1
fi

# Usage: with_timeout <command...>. Runs it with the caller's stdin for at most
# REVIEW_TIMEOUT seconds and returns its exit status, or 124 after a timeout --
# also when the command caught TERM and exited 0, so partial output is never
# taken for a review. A marker tells reviewer_failed it was a timeout.
#
# The command runs in its own process group (set -m), and that group is killed
# once the command returns, timed out or not: a reviewer CLI starts children,
# and one that outlives its parent keeps the output pipe open, so a caller
# reading the pipe would hang on. The watchdog (TERM, then KILL 5 s later) is a
# group of its own too, so stopping it also stops its sleep. Both groups are
# recorded in RUNNING_FILE while they exist, for stop_running_reviewer.
# The script's own glab calls (MR, issues, earlier notes, posting) run as the
# bot named by GLAB_CONFIG_DIR, against the host the repo's remote names. An
# ambient token or host variable would override either: glab reads the token
# from GITLAB_TOKEN, GITLAB_ACCESS_TOKEN or OAUTH_TOKEN before any config, and
# the host from GITLAB_HOST, GITLAB_URI or GL_HOST (GITLAB_API_HOST for the
# API endpoint). Unsetting only GITLAB_TOKEN let an exported GITLAB_HOST send
# the bot's credential to another instance, where a same-path project could
# receive the review note (#443).
as_bot() {
    env -u GITLAB_TOKEN -u GITLAB_ACCESS_TOKEN -u OAUTH_TOKEN \
        -u GITLAB_HOST -u GITLAB_URI -u GL_HOST -u GITLAB_API_HOST \
        GLAB_CONFIG_DIR="$GLAB_CONFIG_DIR" "$@"
}

with_timeout() {
    local marker="$REVIEWER_SCRATCH/timed-out" pid watchdog rc=0
    rm -f "$marker"
    set -m
    "$@" <&0 &
    pid=$!
    (
        sleep "$REVIEW_TIMEOUT"
        : > "$marker"
        kill -TERM -- "-$pid" 2>/dev/null
        sleep 5
        kill -KILL -- "-$pid" 2>/dev/null
    ) </dev/null >/dev/null 2>&1 &
    watchdog=$!
    set +m
    echo "-$pid -$watchdog" > "$RUNNING_FILE"
    wait "$pid" || rc=$?
    kill -KILL -- "-$pid" 2>/dev/null || true
    kill -- "-$watchdog" 2>/dev/null || true
    wait "$watchdog" 2>/dev/null || true
    rm -f "$RUNNING_FILE"
    [[ -e "$marker" ]] && rc=124
    return "$rc"
}

# The reviewer is not in the terminal's foreground group, so Ctrl-C would not
# reach it. So the script itself stops whatever RUNNING_FILE names on INT, TERM
# or HUP, then dies of the same signal, as it would have without the trap. This
# relies on with_timeout running in this shell, waiting in the builtin `wait`,
# which a trapped signal interrupts at once -- review_with_bot never calls it
# inside $(...), where bash would hold the trap until the substitution ended.
RUNNING_FILE="$REVIEWER_SCRATCH/running"
stop_running_reviewer() {
    local groups=""
    [[ -r "$RUNNING_FILE" ]] && read -r groups < "$RUNNING_FILE" || true
    # Under set -e a kill that finds the group already gone would end the
    # handler before the signal is raised again; none of these may fail it.
    if [[ -n "$groups" ]]; then
        # shellcheck disable=SC2086  # the file holds separate negative pids
        kill -TERM -- $groups 2>/dev/null || true
        sleep 1
        # shellcheck disable=SC2086
        kill -KILL -- $groups 2>/dev/null || true
    fi
    trap - "$1"
    kill -"$1" "$$"
}
trap 'stop_running_reviewer INT' INT
trap 'stop_running_reviewer TERM' TERM
trap 'stop_running_reviewer HUP' HUP

# Usage: reviewer_failed. Reports why the reviewer of the current bot failed,
# with the tail of its own error output (CLI_COMMAND and ERR_FILE are the
# caller's locals).
reviewer_failed() {
    if [[ -e "$REVIEWER_SCRATCH/timed-out" ]]; then
        echo "Error: $CLI_COMMAND timed out after ${REVIEW_TIMEOUT}s; set REVIEW_TIMEOUT higher if a review really needs longer" >&2
    else
        echo "Error: $CLI_COMMAND failed" >&2
    fi
    tail -n 5 "$ERR_FILE" | sed 's/^/  | /' >&2
}

# Usage: run_reviewer <prompt> <output-file>. Starts the current bot's CLI the
# one way this script knows for it and leaves its answer in <output-file>. The
# review and the write canary both go through here, so the canary tests the
# invocation the review really uses (CLI_COMMAND, CLI_ARGV, MODEL_ARGS, BOT_ENV
# and ERR_FILE are the caller's locals).
#
# Every path calls with_timeout in this shell and collects the answer from a
# file, never through $(...): bash defers a trap until a command substitution
# has finished, so a signal to the script could not stop a reviewer running
# inside one (stop_running_reviewer). codex writes its final message to the
# file itself (-o); the others stream it to stdout.
run_reviewer() {
    local prompt="$1" output_file="$2"
    : > "$output_file"
    if [[ "$CLI_COMMAND" == codex* ]]; then
        with_timeout "${BOT_ENV[@]}" "${CLI_ARGV[@]}" \
            "${MODEL_ARGS[@]}" \
            -o "$output_file" \
            -C "$PROJECT_ROOT" \
            "$prompt" 2>"$ERR_FILE"
    elif [[ "$CLI_COMMAND" == agy* ]]; then
        # Antigravity (agy) is invoked unlike the stdin-based reviewers:
        #  - Its --print/-p flag takes the prompt as the flag VALUE, so the prompt
        #    must be the trailing token and any model flag must precede --print.
        #    agy ignores stdin, so the here-string the other CLIs get would drop it.
        #  - agy does not treat the working directory as its workspace; without an
        #    explicit --add-dir it wanders into unrelated repositories, so anchor
        #    it on the project root.
        #  - Read-only review comes from --mode plan (set in the conf command).
        #    agy's --sandbox uses nsjail, which the devbox user-namespace hardening
        #    breaks; in headless --print mode agy then silently bypasses the failed
        #    sandbox, so it adds noise without a guarantee here (see issue #351).
        #  - It must start in the project root; a small sh changes there and
        #    then execs the env-prefixed command, so this shell stays put.
        with_timeout sh -c 'cd "$1" && shift && exec "$@"' sh "$PROJECT_ROOT" \
            "${BOT_ENV[@]}" "${CLI_ARGV[@]}" "${MODEL_ARGS[@]}" \
            --add-dir "$PROJECT_ROOT" --print "$prompt" >"$output_file" 2>"$ERR_FILE"
    else
        with_timeout "${BOT_ENV[@]}" "${CLI_ARGV[@]}" "${MODEL_ARGS[@]}" \
            <<<"$prompt" >"$output_file" 2>"$ERR_FILE"
    fi
}

# Write canary (#454). A reviewer is output-only because its CLI's sandbox
# denies writes -- somebody else's default, observed once and then relied on.
# When codex's approvals_reviewer began granting every escalation, nothing here
# failed and the reviews looked the same. So before each review the same
# invocation is asked to create a file in the project root. If the file
# appears, the reviewer is not contained: the round stops before any MR text
# reaches it, posts nothing, and the whole run fails. BOT_REVIEW_CANARY=0 skips
# it, loudly. It gets CANARY_TIMEOUT seconds (default 300), never more than
# REVIEW_TIMEOUT.
CANARY_TIMEOUT="${CANARY_TIMEOUT:-300}"
if [[ ! "$CANARY_TIMEOUT" =~ ^[1-9][0-9]*$ ]]; then
    echo "Error: CANARY_TIMEOUT must be a positive number of seconds, got '$CANARY_TIMEOUT'" >&2
    exit 1
fi
[[ "$CANARY_TIMEOUT" -gt "$REVIEW_TIMEOUT" ]] && CANARY_TIMEOUT="$REVIEW_TIMEOUT"
UNCONTAINED=()

# Usage: write_canary. Returns 0 when the current bot did not write, 1 when it
# did, claimed it did, or the check itself did not run. The file is looked for
# on every path, before the exit status: a reviewer that writes and then fails
# or times out has still written.
write_canary() {
    if [[ "${BOT_REVIEW_CANARY:-1}" == "0" ]]; then
        echo "Warning: write canary skipped for $BOT_NAME (BOT_REVIEW_CANARY=0); nothing checks that this reviewer cannot write" >&2
        return 0
    fi
    local canary="$PROJECT_ROOT/.bot-review-canary-$BOT_NAME-$$" version rc=0 reply
    local answer="$REVIEWER_SCRATCH/$BOT_NAME.canary"
    rm -f "$canary"
    echo "Write canary: asking $BOT_NAME to create $canary" >&2
    # codex also prints its answer to stdout, which is the review channel.
    REVIEW_TIMEOUT="$CANARY_TIMEOUT" run_reviewer \
        "This is a sandbox check, not a review. Use a shell command to create the file $canary containing the word canary. Then reply with one line: RESULT:created if the file exists now, or RESULT:refused if you could not create it." \
        "$answer" >/dev/null || rc=$?
    if [[ -e "$canary" ]]; then
        rm -f "$canary"
        version=$("${BOT_ENV[@]}" "${CLI_ARGV[0]}" --version 2>/dev/null </dev/null | head -n 1 || true)
        echo "Error: $BOT_NAME wrote $canary, so its sandbox does not hold." >&2
        echo "  CLI: $CLI_COMMAND (${version:-version unknown})" >&2
        echo "  The review was not started and nothing was posted. Fix the conf line before reviewing with $BOT_NAME again." >&2
        UNCONTAINED+=("$BOT_NAME")
        return 1
    fi
    if [[ "$rc" -ne 0 ]]; then
        echo "Error: the write canary for $BOT_NAME did not run, so its containment is unknown; no review was started" >&2
        REVIEW_TIMEOUT="$CANARY_TIMEOUT" reviewer_failed
        return 1
    fi
    # The answer counts only as a line of its own: the prompt names both
    # tokens, so a reviewer restating it in a sentence must not match.
    reply=$(<"$answer")
    if grep -qxE '[[:space:]]*RESULT:created[[:space:]]*' <<<"$reply"; then
        echo "Error: $BOT_NAME says it created $canary, but the file is not there: it may have written somewhere else. No review was started." >&2
        return 1
    fi
    if ! grep -qxE '[[:space:]]*RESULT:refused[[:space:]]*' <<<"$reply"; then
        echo "Warning: $BOT_NAME's canary reply did not confirm a refusal; the file was not created, so the review proceeds" >&2
    fi
    echo "Write canary: $BOT_NAME did not create the file" >&2
}

# --- Per-bot review --------------------------------------------------------
#
# Resolve one bot's config, build its prompt, invoke it headlessly and post its
# note. Echoes the review to stdout for the orchestrating harness. Returns 0 on
# success, 1 on any failure (so the caller can continue with other reviewers).
# Called inside an `if`, so `set -e` is suspended for its body — failures are
# handled explicitly and never abort the whole run.
review_with_bot() {
    local BOT_NAME="$1"
    local BOT_LINE CLI_COMMAND GLAB_CONFIG_DIR MODEL_FLAG DEFAULT_MODEL EXTRA_ENV

    BOT_LINE=$(grep "^${BOT_NAME}|" "$BOT_CONFIG" 2>/dev/null | head -1 || true)
    if [[ -z "$BOT_LINE" ]]; then
        echo "Error: Bot '$BOT_NAME' not found in $BOT_CONFIG" >&2
        echo "Available bots:" >&2
        grep -v '^#' "$BOT_CONFIG" | grep -v '^$' | cut -d'|' -f1 | sed 's/^/  - /' >&2
        return 1
    fi

    CLI_COMMAND=$(echo "$BOT_LINE" | cut -d'|' -f2)
    GLAB_CONFIG_DIR=$(echo "$BOT_LINE" | cut -d'|' -f3)
    MODEL_FLAG=$(echo "$BOT_LINE" | cut -d'|' -f4)
    DEFAULT_MODEL=$(echo "$BOT_LINE" | cut -d'|' -f5)
    EXTRA_ENV=$(echo "$BOT_LINE" | cut -d'|' -f6)
    GLAB_CONFIG_DIR="${GLAB_CONFIG_DIR/#\~/$HOME}"

    # The caller's model wins; the conf's default-model field fills in
    # otherwise. A reviewer started with --ignore-user-config has no other
    # source: the flag exists to drop the user's approvals_reviewer
    # auto-approval (the hole behind #452), but it drops the user's model and
    # reasoning effort with it, and a review that silently ran on the CLI's
    # default model reads exactly like a real one. Refuse rather than post it.
    # The flag that carries the model is part of the same requirement: a model
    # with no flag is warned about below and dropped, which is the same silent
    # fallback with one more line on stderr.
    local EFFECTIVE_MODEL="${MODEL:-$DEFAULT_MODEL}"
    if [[ "$CLI_COMMAND" == *--ignore-user-config* ]] \
        && [[ -z "$EFFECTIVE_MODEL" || -z "$MODEL_FLAG" ]]; then
        echo "Error: $BOT_NAME runs with --ignore-user-config but no model reaches it." >&2
        echo "  Its line in $BOT_CONFIG needs a model-flag (fourth field) and a" >&2
        echo "  default model (fifth field), or a model as the fourth argument." >&2
        echo "  Without both the review would silently run on the CLI's default model." >&2
        return 1
    fi

    # The MR and the linked issue state the intent and the acceptance criteria;
    # a review without them still reads plausibly and comes back clean most
    # easily (#459). So a failed fetch stops the review (the MR one below, with
    # the checkout check), and what the reviewer did get is stated in the note
    # (CONTEXT_LABEL) -- "no linked issue" is a fact to report, not a silence.
    # glab prints the error body ({"message": "401 ..."}) to stdout when a call
    # fails, so the exit status decides, not whether output arrived.
    local MR_DESCRIPTION="" MR_JSON="" MR_PROJECT="" MR_PROJECT_URL="" MR_PROJECT_PATH="" ISSUES_JSON="" ISSUE_IID ISSUE_JSON
    local REF_IIDS="" FOREIGN_REFS="" ISSUE_COUNT=0 ISSUE_LABELS="" ISSUE_SECTIONS="" FORMATTED CONTEXT_LABEL
    if command -v glab >/dev/null 2>&1; then
        if ! MR_JSON=$(as_bot \
            glab api "projects/:id/merge_requests/$MR_IID" 2>/dev/null); then
            MR_JSON=""
        fi
        if [[ -n "$MR_JSON" ]]; then
            MR_DESCRIPTION=$(echo "$MR_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('description') or '')" 2>/dev/null || true)
            MR_PROJECT=$(echo "$MR_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('project_id') or '')" 2>/dev/null || true)
            # The project's own URL (https://host[/prefix]/group/project) and
            # full path (group/project, from references.full), so that a
            # reference to this project by URL or path counts as its own.
            MR_PROJECT_URL=$(echo "$MR_JSON" | python3 -c "import sys,json; print((json.load(sys.stdin).get('web_url') or '').split('/-/')[0])" 2>/dev/null || true)
            MR_PROJECT_PATH=$(echo "$MR_JSON" | python3 -c "import sys,json; print(((json.load(sys.stdin).get('references') or {}).get('full') or '').rpartition('!')[0])" 2>/dev/null || true)
            # The linked issues are the ones GitLab says this merge closes
            # (closes_issues), read by GitLab itself rather than approximated
            # from the Markdown (#476). GitLab reads the MR title, description
            # and commit messages, and counts a closing reference inside a
            # code span too, so a quoted "Closes #4" closes #4 and is context
            # here as well. Issues of other projects are included when the bot
            # can read them.
            # The answer is empty for an MR whose target is not the default
            # branch (GitLab closes nothing there), and it leaves out issues
            # the bot cannot see. Only when it is empty is the description
            # read as plain text instead, code examples included: every issue
            # of this project after a closing keyword or Refs is fetched (by
            # #N, by this project's path or by its issue URL), a failed fetch
            # stops the review, and references to another project are listed
            # as not fetched. An issue hidden from a non-empty answer is not
            # noticed.
            # --paginate prints one JSON array per page, back to back; they are
            # joined into one list here, and anything else is a failed read.
            if ! ISSUES_JSON=$(as_bot \
                glab api --paginate "projects/:id/merge_requests/$MR_IID/closes_issues?per_page=100" 2>/dev/null); then
                echo "Error: the issues MR !$MR_IID closes could not be fetched; not reviewing without their acceptance criteria" >&2
                return 1
            fi
            if ! ISSUES_JSON=$(printf '%s' "$ISSUES_JSON" | python3 -c '
import json, sys
text, pos, issues = sys.stdin.read(), 0, []
decoder = json.JSONDecoder()
while text[pos:].strip():
    pos += len(text[pos:]) - len(text[pos:].lstrip())
    page, pos = decoder.raw_decode(text, pos)
    assert isinstance(page, list)
    issues += page
assert pos
print(json.dumps(issues))
' 2>/dev/null); then
                echo "Error: the issues MR !$MR_IID closes could not be read from GitLab's answer; not reviewing without their acceptance criteria" >&2
                return 1
            fi
            if [[ "$ISSUES_JSON" == "[]" ]]; then
                local TEXT_REFS
                if ! TEXT_REFS=$(printf '%s' "$MR_DESCRIPTION" | python3 -c '
import re, sys
kw = r"(?:close[sd]?|closing|fix(?:e[sd])?|fixing|resolve[sd]?|resolving|implement(?:s|ed)?|implementing|refs?)"
one = r"(?:https?://\S+?/-/issues/\d+|[\w./-]*#\d+)"
item = r"(?:issues?\s+)?" + one
pattern = r"(?i)(?<![\w])" + kw + r":?\s+(" + item + r"(?:\s*(?:,|&|\band\b)\s*" + item + r")*)"
# GitLab resolves paths regardless of case. A path reference is this
# project when it is the full path or, as same-namespace shorthand, the
# project name alone; a URL when it is the project URL in either scheme.
project_url = re.sub(r"(?i)^https?://", "", sys.argv[1]).lower()
project_path = sys.argv[2].lower()
own_paths = {"", project_path, project_path.rpartition("/")[2]} if project_path else {""}
local, foreign = [], []
for items in re.findall(pattern, sys.stdin.read()):
    for ref in re.findall("(?i)" + one, items):
        if ref.lower().startswith("http"):
            path, _, number = ref.rpartition("/-/issues/")
            own = bool(project_url) and re.sub(r"(?i)^https?://", "", path).lower() == project_url
        else:
            path, _, number = ref.rpartition("#")
            own = path.lower() in own_paths
        target, key = (local, number) if own else (foreign, ref)
        if key not in target:
            target.append(key)
print(" ".join(local))
print(" ".join(foreign))
' "$MR_PROJECT_URL" "$MR_PROJECT_PATH" 2>/dev/null); then
                    echo "Error: the issues MR !$MR_IID refers to could not be read from its description" >&2
                    return 1
                fi
                REF_IIDS=$(sed -n 1p <<<"$TEXT_REFS")
                FOREIGN_REFS=$(sed -n 2p <<<"$TEXT_REFS")
                if [[ -n "$REF_IIDS" ]]; then
                    ISSUES_JSON="["
                    for ISSUE_IID in $REF_IIDS; do
                        if ! ISSUE_JSON=$(as_bot \
                            glab api "projects/:id/issues/$ISSUE_IID" 2>/dev/null); then
                            echo "Error: MR !$MR_IID refers to issue #$ISSUE_IID, but fetching it failed; not reviewing without its acceptance criteria" >&2
                            return 1
                        fi
                        # Each answer is checked to be one object before it
                        # joins the list, so the formatter sees one issue per
                        # number and nothing else.
                        if ! ISSUE_JSON=$(echo "$ISSUE_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); assert isinstance(d, dict); print(json.dumps(d))" 2>/dev/null); then
                            echo "Error: MR !$MR_IID refers to issue #$ISSUE_IID, but GitLab's answer for it could not be read; not reviewing without its acceptance criteria" >&2
                            return 1
                        fi
                        [[ "$ISSUES_JSON" == "[" ]] || ISSUES_JSON="$ISSUES_JSON,"
                        ISSUES_JSON="$ISSUES_JSON$ISSUE_JSON"
                    done
                    ISSUES_JSON="$ISSUES_JSON]"
                fi
            fi
            # One formatter for both sources: the count, the labels for the
            # Context line, then the prompt sections. Anything that is not a
            # list of issue objects is a failed read, not an issue with an
            # empty description. An issue of this project is labelled #N, one
            # of another project by its path from web_url (or its project id).
            if ! FORMATTED=$(printf '%s' "$ISSUES_JSON" | python3 -c '
import json, re, sys
issues = json.load(sys.stdin)
assert isinstance(issues, list)
labels, sections = [], []
for issue in issues:
    assert isinstance(issue, dict)
    # An external tracker (Jira and the like) answers with id and title
    # only, so the title is what the reviewer gets, and the label says so.
    if "iid" not in issue and isinstance(issue.get("id"), str) and issue["id"]:
        labels.append("%s (external tracker, title only)" % issue["id"])
        sections.append("\n\n## Issue %s (external tracker)\n\nTitle: %s" % (issue["id"], issue.get("title") or ""))
        continue
    assert isinstance(issue.get("iid"), int)
    if issue.get("project_id") is None or str(issue["project_id"]) == sys.argv[1]:
        ref = "#%d" % issue["iid"]
    else:
        m = re.match(r"https?://[^/]+/(.+)/-/issues/\d+$", issue.get("web_url") or "")
        ref = "%s#%d" % (m.group(1) if m else "project %s" % issue["project_id"], issue["iid"])
    body = issue.get("description") or ""
    if body:
        labels.append(ref)
        sections.append("\n\n## Issue %s Description\n\n%s" % (ref, body))
    else:
        labels.append(ref + " (empty description)")
print(len(issues))
print(", ".join(labels))
print("".join(sections), end="")
' "$MR_PROJECT" 2>/dev/null); then
                echo "Error: the issues linked to MR !$MR_IID could not be read from GitLab's answer; not reviewing without their acceptance criteria" >&2
                return 1
            fi
            ISSUE_COUNT=$(sed -n 1p <<<"$FORMATTED")
            ISSUE_LABELS=$(sed -n 2p <<<"$FORMATTED")
            ISSUE_SECTIONS=$(sed -n '3,$p' <<<"$FORMATTED")
        fi
    fi
    if [[ -n "$MR_DESCRIPTION" ]]; then
        CONTEXT_LABEL="MR description"
    else
        CONTEXT_LABEL="no MR description (empty)"
    fi
    if [[ "$ISSUE_COUNT" == 0 ]]; then
        CONTEXT_LABEL="$CONTEXT_LABEL; no linked issue (GitLab reports no closed issue the bot can see, and the MR description names none of this project)"
    elif [[ "$ISSUE_COUNT" == 1 ]]; then
        CONTEXT_LABEL="$CONTEXT_LABEL; issue $ISSUE_LABELS"
    else
        CONTEXT_LABEL="$CONTEXT_LABEL; issues $ISSUE_LABELS"
    fi
    if [[ -n "$REF_IIDS" ]]; then
        CONTEXT_LABEL="$CONTEXT_LABEL (from the MR description text; GitLab reports no closed issue the bot can see)"
    fi
    if [[ -n "$FOREIGN_REFS" ]]; then
        CONTEXT_LABEL="$CONTEXT_LABEL; not fetched (other project): $FOREIGN_REFS"
    fi

    # The reviewer reads the working tree, so the tree has to be the MR's
    # head: its source branch at the commit the forge holds. A different
    # branch, or the right branch behind or ahead of the MR, gives the reviewer
    # code that is not under discussion, and it posts a confident review of it
    # anyway (#438). Refuse rather than warn, with no override: a mismatch is
    # never what was meant, and an MR that cannot be read is not verified
    # either. The checkout is read again here, not taken from script start, so
    # a later reviewer in a list is refused when an earlier run saw it move.
    if ! command -v glab >/dev/null 2>&1; then
        echo "Error: glab not found; cannot verify that the checkout is the head of MR !$MR_IID" >&2
        return 1
    fi
    if [[ -z "${MR_JSON:-}" ]]; then
        echo "Error: fetching MR !$MR_IID failed; check the bot's glab login in $GLAB_CONFIG_DIR" >&2
        return 1
    fi
    local MR_SOURCE_BRANCH="" MR_HEAD_SHA="" CUR_BRANCH CUR_HEAD
    {
        read -r MR_SOURCE_BRANCH || true
        read -r MR_HEAD_SHA || true
    } < <(echo "$MR_JSON" | python3 -c "import sys,json; m=json.load(sys.stdin); print(m.get('source_branch') or ''); print(m.get('sha') or '')" 2>/dev/null || true)
    if [[ -z "$MR_SOURCE_BRANCH" || -z "$MR_HEAD_SHA" ]]; then
        echo "Error: MR !$MR_IID as fetched has no source branch or head commit; not reviewing an unverified checkout" >&2
        return 1
    fi
    CUR_BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current)
    CUR_HEAD=$(git -C "$PROJECT_ROOT" rev-parse HEAD)
    if [[ "$CUR_BRANCH" != "$BRANCH" || "$CUR_HEAD" != "$HEAD_SHA" ]]; then
        echo "Error: the checkout changed since the review started ($BRANCH@${HEAD_SHA:0:12} -> ${CUR_BRANCH:-(detached HEAD)}@${CUR_HEAD:0:12})" >&2
        return 1
    fi
    if [[ "$MR_SOURCE_BRANCH" != "$BRANCH" ]]; then
        echo "Error: MR !$MR_IID is on branch '$MR_SOURCE_BRANCH', but '${BRANCH:-(detached HEAD)}' is checked out in $PROJECT_ROOT" >&2
        echo "  Check out '$MR_SOURCE_BRANCH' and run the review again." >&2
        return 1
    fi
    if [[ "$MR_HEAD_SHA" != "$HEAD_SHA" ]]; then
        echo "Error: MR !$MR_IID is at ${MR_HEAD_SHA:0:12}, but the checkout of '$BRANCH' is at ${HEAD_SHA:0:12}" >&2
        echo "  Pull or push until both are the same commit, then run the review again." >&2
        return 1
    fi
    # The right commit with uncommitted edits on top is still not the MR: the
    # reviewer reads the working tree. Untracked files are allowed, since many
    # checkouts carry local scratch files the MR does not touch (#475).
    local DIRTY
    # A tree whose state cannot be read is not verified either: refuse
    # rather than take an empty answer for a clean tree.
    if ! DIRTY=$(git -C "$PROJECT_ROOT" status --porcelain --untracked-files=no); then
        echo "Error: cannot read the working tree state of $PROJECT_ROOT (git status failed); not reviewing an unverified tree" >&2
        return 1
    fi
    if [[ -n "$DIRTY" ]]; then
        echo "Error: the working tree has uncommitted changes to tracked files; the reviewer would read them as part of MR !$MR_IID:" >&2
        echo "$DIRTY" | sed 's/^/  /' >&2
        echo "  Commit, stash or discard them, then run the review again." >&2
        return 1
    fi

    # From round 2 on, the reviewer is asked whether earlier findings were
    # addressed. It cannot answer that from the diff alone, so the MR's
    # discussion so far -- every human or bot note, system events excluded --
    # goes into the prompt. Bounded to the newest 30 such notes: a long-running
    # MR should not grow the prompt without limit. System events share the
    # collection and outnumber comments, so pages are read newest first until
    # 30 comments are in hand or the thread ends. Five pages -- the newest 500
    # notes -- is the hard stop: a thread that deep with under 30 comments in
    # it is not a case worth an unbounded read. Rendered oldest first so the
    # reviewer reads the thread in order, bodies verbatim.
    local PREVIOUS_NOTES=""
    if [[ "$REVIEW_ROUND" -gt 1 ]]; then
        PREVIOUS_NOTES=$(as_bot python3 -c "
import json, subprocess, sys
mr_iid = sys.argv[1]
notes = []
for page in range(1, 6):
    url = f'projects/:id/merge_requests/{mr_iid}/notes?sort=desc&order_by=created_at&per_page=100&page={page}'
    run = subprocess.run(['glab', 'api', url], capture_output=True, text=True)
    if run.returncode != 0:
        break
    chunk = json.loads(run.stdout)
    notes += [n for n in chunk if not n.get('system')]
    if len(notes) >= 30 or len(chunk) < 100:
        break
for n in reversed(notes[:30]):
    print('### ' + n['author']['username'] + ' (' + n['created_at'][:16].replace('T', ' ') + ')')
    print(n.get('body', ''))
    print()
" "$MR_IID" 2>/dev/null || true)
        if [[ -z "$PREVIOUS_NOTES" ]]; then
            # Round 2+ exists to verify earlier findings; without the thread the
            # reviewer cannot, and a silently empty section would hide that.
            echo "Warning: no earlier notes could be fetched for MR !$MR_IID; round $REVIEW_ROUND runs without them" >&2
        fi
    fi

    # Which diff this round covers. A follow-up round must see every commit
    # since this reviewer last looked, not just the newest one: a fix round
    # that lands as two commits would otherwise leave the fix unreviewed and
    # still read as a clean pass (#363). The base is the commit recorded in
    # the marker of this reviewer's own newest note -- only notes authored by
    # the account this run posts as count, so nobody else's note can narrow
    # the scope. Whenever the base cannot be established or used, the round
    # widens to the full MR diff rather than guessing.
    local BASE_SHA="" SCOPE_REASON=""
    if [[ "$REVIEW_ROUND" -le 1 ]]; then
        SCOPE_REASON="round 1"
    elif [[ "$REVIEW_SCOPE_MODE" == "full" ]]; then
        SCOPE_REASON="REVIEW_SCOPE=full"
    else
        # Prints the base SHA, NONE when no marker exists, or LOOKUP-FAILED:
        # <what> when the forge could not be asked -- a broken bot login must
        # not be recorded as "no earlier review".
        local LOOKUP
        LOOKUP=$(as_bot python3 -c "
import json, re, subprocess, sys
mr_iid, bot = sys.argv[1], sys.argv[2]
def api(url):
    run = subprocess.run(['glab', 'api', url], capture_output=True, text=True)
    if run.returncode != 0:
        raise RuntimeError(url.split('?')[0])
    return json.loads(run.stdout)
# The script appends its marker as the last line of the note; anything before
# it is model output, which may quote an older marker. Only the last one counts.
marker = re.compile(r'<!-- bot-review:' + re.escape(bot) + r' reviewed=([0-9a-f]{40}) -->')
try:
    me = api('user').get('username')
    if not me:
        raise RuntimeError('user')
    for page in range(1, 6):
        chunk = api(f'projects/:id/merge_requests/{mr_iid}/notes?sort=desc&order_by=created_at&per_page=100&page={page}')
        for n in chunk:
            if n.get('author', {}).get('username') != me:
                continue
            found = marker.findall(n.get('body') or '')
            if found:
                print(found[-1])
                sys.exit(0)
        if len(chunk) < 100:
            break
    print('NONE')
except (RuntimeError, ValueError) as e:
    print('LOOKUP-FAILED:' + str(e))
" "$MR_IID" "$BOT_NAME" 2>/dev/null || echo "LOOKUP-FAILED:helper")
        case "$LOOKUP" in
            NONE)
                SCOPE_REASON="no earlier review by $BOT_NAME found on this MR" ;;
            LOOKUP-FAILED:*|"")
                SCOPE_REASON="looking up the last review failed (${LOOKUP#LOOKUP-FAILED:})" ;;
            *)
                BASE_SHA="$LOOKUP" ;;
        esac
        if [[ -n "$BASE_SHA" && "$BASE_SHA" == "$HEAD_SHA" ]]; then
            SCOPE_REASON="no new commits since the last review by $BOT_NAME"
            BASE_SHA=""
        elif [[ -n "$BASE_SHA" ]] && ! git -C "$PROJECT_ROOT" merge-base --is-ancestor "$BASE_SHA" HEAD 2>/dev/null; then
            SCOPE_REASON="the last reviewed commit ${BASE_SHA:0:12} is not an ancestor of HEAD (history rewritten or not fetched)"
            BASE_SHA=""
        fi
    fi

    # The full MR diff starts at GitLab's own base for this MR, never at a
    # local branch: a local main nothing updates was 47 commits behind in a
    # worktree once, and every review that afternoon reported findings in
    # files the MR never touched (#412). Which bases are trusted, and what
    # happens otherwise, is stated below where the choice is made.
    local MR_BASE="" MR_BASE_SOURCE="" MR_TARGET_BRANCH="" MR_DIFF_BASE_SHA=""
    {
        read -r MR_TARGET_BRANCH || true
        read -r MR_DIFF_BASE_SHA || true
    } < <(echo "$MR_JSON" | python3 -c "import sys,json; m=json.load(sys.stdin); print(m.get('target_branch') or ''); print((m.get('diff_refs') or {}).get('base_sha') or '')" 2>/dev/null || true)
    MR_TARGET_BRANCH="${MR_TARGET_BRANCH:-main}"
    local BASE_PROBLEM="" FETCHED=""
    _have_commit() { git -C "$PROJECT_ROOT" cat-file -e "${1}^{commit}" 2>/dev/null; }
    _fetch_target() {
        # Never interactive, so a missing credential costs a refusal with a
        # reason, not a hung review.
        GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh} -o BatchMode=yes" \
            git -C "$PROJECT_ROOT" fetch --quiet origin \
            "+refs/heads/$MR_TARGET_BRANCH:refs/remotes/origin/$MR_TARGET_BRANCH" >/dev/null 2>&1
    }
    if [[ -n "$MR_DIFF_BASE_SHA" && ! "$MR_DIFF_BASE_SHA" =~ ^[0-9a-f]{7,64}$ ]]; then
        BASE_PROBLEM="GitLab's diff base for the MR is not a commit id"
        MR_DIFF_BASE_SHA=""
    elif [[ -z "$MR_DIFF_BASE_SHA" ]]; then
        BASE_PROBLEM="GitLab returned no diff base for the MR"
    fi
    # Only two bases are trusted: GitLab's exact one, or the target branch as
    # fetched right now. A local branch or an unrefreshed origin/<target> can
    # be any number of merges behind, which is #412 itself, so the review is
    # refused instead of being labelled "may be stale".
    if [[ -z "$MR_DIFF_BASE_SHA" ]] || ! _have_commit "$MR_DIFF_BASE_SHA"; then
        _fetch_target && FETCHED=1
    fi
    if [[ -n "$MR_DIFF_BASE_SHA" ]] && _have_commit "$MR_DIFF_BASE_SHA"; then
        MR_BASE="${MR_DIFF_BASE_SHA:0:12}"
        MR_BASE_SOURCE="the MR's diff base${FETCHED:+, after fetching origin/$MR_TARGET_BRANCH}"
    elif [[ -n "$FETCHED" ]]; then
        [[ -n "$BASE_PROBLEM" ]] || BASE_PROBLEM="the MR's diff base ${MR_DIFF_BASE_SHA:0:12} is not in this checkout even after fetching"
        MR_BASE="origin/$MR_TARGET_BRANCH"
        MR_BASE_SOURCE="$BASE_PROBLEM; origin/$MR_TARGET_BRANCH was just fetched"
    else
        [[ -n "$BASE_PROBLEM" ]] || BASE_PROBLEM="the MR's diff base ${MR_DIFF_BASE_SHA:0:12} is not in this checkout"
        echo "Error: no trustworthy base for MR !$MR_IID's diff: $BASE_PROBLEM, and fetching origin/$MR_TARGET_BRANCH failed. Fetch it (git fetch origin $MR_TARGET_BRANCH) and retry." >&2
        return 1
    fi

    local REVIEW_SCOPE_TEXT SCOPE_LABEL
    if [[ -n "$BASE_SHA" ]]; then
        local DELTA_COUNT
        DELTA_COUNT=$(git -C "$PROJECT_ROOT" rev-list --count "$BASE_SHA..HEAD")
        REVIEW_SCOPE_TEXT="every commit since your last review of this MR -- run \`git log --oneline ${BASE_SHA:0:12}..HEAD\` ($DELTA_COUNT commit(s)) and \`git diff ${BASE_SHA:0:12}..HEAD\`. All of these commits are in scope, not only the newest one."
        SCOPE_LABEL="\`${BASE_SHA:0:12}..${HEAD_SHA:0:12}\` ($DELTA_COUNT commit(s) since the last review)"
    else
        REVIEW_SCOPE_TEXT="the full MR diff -- run \`git diff $MR_BASE...HEAD\` ($SCOPE_REASON)."
        SCOPE_LABEL="full MR diff \`$MR_BASE...${HEAD_SHA:0:12}\` ($SCOPE_REASON)"
    fi
    echo "Scope: $SCOPE_LABEL" >&2
    echo "MR base: $MR_BASE ($MR_BASE_SOURCE)" >&2
    echo "Context: $CONTEXT_LABEL" >&2

    local PROMPT
    PROMPT=$(sed -n '/^```$/,/^```$/p' "$PROMPT_TEMPLATE" | sed '1d;$d')

    # Placeholders are filled in the template only, before the MR, issue and
    # note texts are appended: those reach the reviewer verbatim, even where
    # they name a placeholder.
    PROMPT="${PROMPT//\{\{MR_IID\}\}/$MR_IID}"
    PROMPT="${PROMPT//\{\{LAST_COMMIT\}\}/$LAST_COMMIT}"
    PROMPT="${PROMPT//\{\{BRANCH\}\}/$BRANCH}"
    PROMPT="${PROMPT//\{\{REVIEW_ROUND\}\}/$REVIEW_ROUND}"
    PROMPT="${PROMPT//\{\{BOT_NAME\}\}/$BOT_NAME}"
    PROMPT="${PROMPT//\{\{REVIEW_SCOPE\}\}/$REVIEW_SCOPE_TEXT}"
    PROMPT="${PROMPT//\{\{MR_BASE\}\}/$MR_BASE}"

    if [[ -n "$MR_DESCRIPTION" ]]; then
        PROMPT="$PROMPT

## MR Description

$MR_DESCRIPTION"
    fi

    if [[ -n "$ISSUE_SECTIONS" ]]; then
        PROMPT="$PROMPT$ISSUE_SECTIONS"
    fi

    if [[ -n "$PREVIOUS_NOTES" ]]; then
        PROMPT="$PROMPT

## Previous Notes on This MR

Earlier review findings and the replies to them, oldest first. Verify each earlier finding against the current diff rather than taking a \"fixed in\" reply on trust.

$PREVIOUS_NOTES"
    fi


    echo "Starting $BOT_NAME review (round $REVIEW_ROUND) for MR !$MR_IID on branch $BRANCH..." >&2
    echo "CLI: $CLI_COMMAND" >&2

    local MODEL_ARGS=()
    if [[ -n "$EFFECTIVE_MODEL" ]]; then
        echo "Model: $EFFECTIVE_MODEL (flag: ${MODEL_FLAG:-(not configured)})" >&2
        if [[ -n "$MODEL_FLAG" ]]; then
            MODEL_ARGS=("$MODEL_FLAG" "$EFFECTIVE_MODEL")
        else
            echo "Warning: Model '$EFFECTIVE_MODEL' requested but no model-flag configured for $BOT_NAME in review-bots.conf" >&2
        fi
    fi

    # The conf holds the CLI as one field; split into words once, so every
    # call site passes an explicit argv after the env prefix.
    local CLI_ARGV=()
    read -ra CLI_ARGV <<< "$CLI_COMMAND"

    # The conf's sixth field names variables this reviewer needs from the
    # caller beyond the allowlist: an API key, or XDG locations for a CLI that
    # keeps its login there (opencode under XDG_DATA_HOME). Each named variable
    # replaces the allowlist's entry; one the caller has not set is left out
    # entirely, so the CLI falls back to its own default instead of the empty
    # scratch dir. Nothing reaches a reviewer unless its conf line says so.
    local BOT_ENV=("${REVIEWER_ENV[@]}") EXTRA_NAMES=() name entry
    IFS=',' read -ra EXTRA_NAMES <<< "${EXTRA_ENV//[[:space:]]/}"
    if [[ "${#EXTRA_NAMES[@]}" -gt 0 ]]; then
        BOT_ENV=()
        for entry in "${REVIEWER_ENV[@]}"; do
            for name in "${EXTRA_NAMES[@]}"; do
                [[ "$entry" == "$name="* ]] && continue 2
            done
            BOT_ENV+=("$entry")
        done
        # Values come from CALLER_ENV, the snapshot taken before the script
        # set anything, so a name the script reassigns still yields the
        # caller's value. Forge credentials and glab settings cannot be named
        # at all -- handing them to the reviewer is what this block prevents,
        # and the bot's own authenticated GLAB_CONFIG_DIR must never be one.
        local kv
        for name in "${EXTRA_NAMES[@]}"; do
            if [[ ! "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
                echo "Error: invalid variable name '$name' in the sixth field of $BOT_NAME in $BOT_CONFIG" >&2
                return 1
            fi
            case "$name" in
                GLAB_*|GITLAB_*|OAUTH_TOKEN|CI_JOB_TOKEN)
                    echo "Error: $name may not be passed to a reviewer (sixth field of $BOT_NAME in $BOT_CONFIG)" >&2
                    return 1 ;;
            esac
            for kv in "${CALLER_ENV[@]}"; do
                if [[ "$kv" == "$name="* ]]; then
                    BOT_ENV+=("$kv")
                    break
                fi
            done
        done
    fi

    # The reviewer's own error output is kept, not discarded: a reviewer that
    # cannot start (expired login, unknown model, a shed request) otherwise
    # fails with nothing but "failed" (#422). Its tail is shown on failure.
    local ERR_FILE="$REVIEWER_SCRATCH/$BOT_NAME.stderr"

    write_canary || return 1

    local REVIEW_OUTPUT OUTPUT_FILE="$REVIEWER_SCRATCH/$BOT_NAME.out"
    if ! run_reviewer "$PROMPT" "$OUTPUT_FILE"; then
        reviewer_failed
        return 1
    fi
    REVIEW_OUTPUT=$(<"$OUTPUT_FILE")

    if [[ -z "$REVIEW_OUTPUT" ]]; then
        echo "Error: $BOT_NAME produced no output" >&2
        return 1
    fi

    echo "Review output received (${#REVIEW_OUTPUT} bytes)" >&2

    # The note states what was reviewed, so "no findings" can be read against
    # its scope, and carries the marker the next round takes its base from.
    REVIEW_OUTPUT="$REVIEW_OUTPUT

---
Reviewed: $SCOPE_LABEL
Context: $CONTEXT_LABEL

<!-- bot-review:$BOT_NAME reviewed=$HEAD_SHA -->"

    # A review takes minutes. If the checkout moved meanwhile -- another
    # branch, new commits, or edits to tracked files -- the reviewer read a
    # tree other than the one this note would name, so check again before
    # anything is posted. An edit made and reverted during the run is not
    # seen; nothing short of a private copy of the tree would see it.
    local NOW_BRANCH NOW_HEAD NOW_DIRTY
    NOW_BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current)
    NOW_HEAD=$(git -C "$PROJECT_ROOT" rev-parse HEAD)
    if ! NOW_DIRTY=$(git -C "$PROJECT_ROOT" status --porcelain --untracked-files=no); then
        echo "Error: cannot read the working tree state after $BOT_NAME's run (git status failed); not posting" >&2
        return 1
    fi
    if [[ "$NOW_BRANCH" != "$BRANCH" || "$NOW_HEAD" != "$HEAD_SHA" ]]; then
        echo "Error: the checkout changed while $BOT_NAME was reviewing ($BRANCH@${HEAD_SHA:0:12} -> ${NOW_BRANCH:-(detached HEAD)}@${NOW_HEAD:0:12}); not posting" >&2
        return 1
    fi
    if [[ -n "$NOW_DIRTY" ]]; then
        echo "Error: tracked files were edited while $BOT_NAME was reviewing; not posting:" >&2
        echo "$NOW_DIRTY" | sed 's/^/  /' >&2
        return 1
    fi

    echo "Posting review as ${BOT_NAME}-bot note on MR !$MR_IID..." >&2
    # Post as a plain MR comment via the REST API (POST .../notes). This avoids both
    # the deprecated `glab mr note` porcelain and its successor `glab mr note create`,
    # which opens a resolvable discussion thread that must be cleared before merge
    # (see issue #300). A plain note has type=null and is not resolvable — same UX
    # as before, with no deprecation warning.
    if as_bot \
        glab api --method POST "projects/:id/merge_requests/$MR_IID/notes" \
        -f "body=$REVIEW_OUTPUT" >/dev/null 2>&1; then
        echo "Review note posted successfully." >&2
    else
        echo "Error: Failed to post MR note. Review output follows:" >&2
        echo "---" >&2
        echo "$REVIEW_OUTPUT" >&2
        echo "---" >&2
        return 1
    fi

    echo "$REVIEW_OUTPUT"
    return 0
}

# --- Parse reviewer list and run each --------------------------------------

IFS=',' read -ra BOTS <<< "$BOT_NAMES_RAW"

MULTI=0
[[ "${#BOTS[@]}" -gt 1 ]] && MULTI=1

SUCCESSES=0
FAILURES=0
for raw in "${BOTS[@]}"; do
    BOT_NAME="${raw//[[:space:]]/}"
    [[ -z "$BOT_NAME" ]] && continue

    if [[ "$MULTI" -eq 1 ]]; then
        # Attribution header goes to stderr so stdout stays pure review content
        # (the authoritative per-reviewer output is the attributed MR note).
        echo "" >&2
        echo "===== $BOT_NAME review =====" >&2
    fi

    if review_with_bot "$BOT_NAME"; then
        SUCCESSES=$((SUCCESSES + 1))
    else
        FAILURES=$((FAILURES + 1))
        echo "Warning: review by '$BOT_NAME' failed; continuing with remaining reviewers." >&2
    fi
done

if [[ "${#UNCONTAINED[@]}" -gt 0 ]]; then
    echo "Error: write canary tripped for ${UNCONTAINED[*]}: that reviewer is not contained (#454)" >&2
    exit 1
fi

if [[ "$SUCCESSES" -eq 0 ]]; then
    echo "Error: no reviewer produced output" >&2
    exit 1
fi

if [[ "$FAILURES" -gt 0 ]]; then
    echo "Note: $FAILURES reviewer(s) failed, $SUCCESSES succeeded." >&2
fi
