# Web Evidence Workflow

How an assistant may use information it retrieves from the web. The rule is
about the claim, not about the tool. Each harness adapter names its own web
tools against it.

## Rule

A summarising fetch may **orient**, never **serve as evidence**.

- **Orient:** finding a page, triaging search results, deciding what to read
  next. Any web tool may be used for this, including one that returns a summary
  or a converted page.
- **Evidence:** anything that ends up in an issue, a merge request, a commit
  message, a review finding or a decision. It needs raw source that the
  assistant has read itself.

Prefer a structured endpoint for evidence over scraped HTML:

- a REST or JSON API (GitHub, GitLab), read with `gh api`, `glab api` or `curl`
- a package registry's metadata (PyPI, npm, crates.io)
- `git` itself (`git log`, `git ls-remote`, `git show`)

A field such as `created_at` is the source. A sentence about the page is
someone's judgement of it.

## Why

Some web tools do not return the page. They return another model's answer to a
question about the page, or a conversion of it, and the assistant never sees
the source.

That answer can be wrong, and it can also be correct in everything it states
and still omit the fact that matters. An omission cannot be detected by reading
the summary that omits it. Re-reading the source, ideally a structured
endpoint, is the only check.

## What the rule does not say

- It does not ban any tool. A summarising fetch is fine for orientation.
- It does not say "always use `curl`". `curl` returns an empty shell for a
  JavaScript-rendered page, floods the context with a large HTML document, and
  is blocked by some User-Agent filters where the harness's own fetch works.
  What makes a claim checkable is a structured endpoint, not the fetch command.

## Checklist before a web-sourced claim is written down

1. Can the claim be traced to raw source I read myself, not only to a summary?
2. Did that source come from a structured endpoint where one exists?
3. Is the source named (URL or command), so a reviewer can re-read it?
