# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

The repository does not currently have a Git remote. Configure its GitHub remote before using commands that infer the repository from the current clone.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`
- **Read an issue**: `gh issue view <number> --comments`
- **List issues**: use `gh issue list` with the appropriate label and state filters
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close an issue**: `gh issue close <number> --comment "..."`

Once a GitHub remote is configured, `gh` will infer the repository when run inside this clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

When set to `yes`, PRs run through the same labels and states as issues using the `gh pr` equivalents.

GitHub shares one number space across issues and PRs. A bare `#42` may be either. Resolve it with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The map is a single issue with child issues as tickets.

- **Map**: an issue labelled `wayfinder:map`, holding the Notes, Decisions-so-far, and Fog body.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue. Where sub-issues are unavailable, add the child to a task list in the map and put `Part of #<map>` at the top of the child body.
- **Blocking**: use GitHub's native issue dependencies. Where dependencies are unavailable, add a `Blocked by: #<n>, #<n>` line to the child body.
- **Frontier query**: list the map's open children and discard issues with an open blocker or assignee. The first issue in map order wins.
- **Claim**: run `gh issue edit <n> --add-assignee @me`.
- **Resolve**: comment with the answer, close the issue, then append a context pointer to the map's Decisions-so-far.
