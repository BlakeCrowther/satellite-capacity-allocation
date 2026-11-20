# satellite-capacity-allocation

<!-- dev-home:standards:start -->
<!-- Managed by dev-home sync-standards.sh. Edit repo-rules.md in dev-home, not here. -->

## Standards

Shared across Blake's repos. Repo-specific sections of this file override these rules.

### Commands

Exact commands are listed elsewhere in this file. Every repo has `bootstrap`, `dev`, `lint`, `typecheck`, `test`, `verify`; `services` if it has backing services.

- Fresh worktree or sandbox: run `bootstrap` first. It never starts services. Never run `pnpm setup` (pnpm builtin; edits shell config).
- Start services only when the task needs them (`services`, or `dev`).
- Never hardcode ports. HTTP via portless (`PORT`); databases via `*_URL` vars in `.env`.
- Agents and sandboxes run `dev` with `PORTLESS_HTTPS=0` (no local CA or sudo) or `PORTLESS=0` (no proxy).
- Run `verify` before claiming done.

### Testing

- Add a test only when it catches a failure nothing else catches. Extend an existing test before adding one.
- No tautological tests: no asserting mocks, restating the implementation, or testing the framework or type checker.
- Test behavior through public interfaces. A bug fix comes with a test that fails without it.

### Git and PRs

- Conventional Commits: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.
- Never push, force-push, or commit directly to the default branch. Every change lands through a PR, squash-merged. Applies even where GitHub doesn't enforce it.
- Branch `<type>/<slug>`. Rename agent-prefixed branches (`claude/`, `cursor/`, `codex/`) before the first push.
- Commit subject `<type>(<scope>): <summary>`, imperative, lowercase, no period. Body says why.
- PR title uses the commit subject format. PR body: Why, What, Testing, Evidence, Notes.
- Add each new PR to the Dev Board project: `gh project item-add 1 --owner BlakeCrowther --url <pr-url>` (skip if `gh` lacks the `project` scope).
- Evidence: screenshots and a short recording for UI changes; command and output for API/CLI/data changes. Media goes on the PR, never in git (`.artifacts/` is gitignored).

### Code comments

Comments are for humans. Default: none.

- Why, not what. Rename before commenting.
- No stale facts: counts, versions, dates, line numbers, caller names, "currently". Point at the source of truth.
- No history ("new", "fixed", "now"); that goes in commits.
- Contract at the boundary: inputs, outputs, invariants, errors, units.
- Tag debt: `TODO(issue):`, `FIXME:`, `HACK:` (why + exit condition), `NOTE:`.
- No dead or commented-out code. Update comments with the code.

### Naming and explaining

Written for a reader who switches in cold: the name or the first line should be enough.

- Names say what a thing is or does, in plain words. No bare codes or numbers as identity (`G5`, `g23`, `tmp2`); a number may count things, never name them.
- One name per concept everywhere (code, files, docs, UI), and one concept per name. Never reuse a name for a second thing. Rename when the meaning drifts, and update every reader in the same change.
- Files and tools are named for their job (`render_contact_sheet`, not `qa_render`). Siblings follow one verb pattern.
- Define each project term once in the repo's glossary. Gloss it at first use in any doc or plan.
- Any pipeline or system of three or more stages gets a map (diagram plus table) in the repo, kept in step with renames.
- Plans, reports and status: first line is the goal or result in plain words. Say what changed, what is verified, what is not. Restate where things stand; assume the reader forgot. Use a table or diagram over a paragraph for stages and comparisons.

### Public-safe repos

Every repo may go public, and history is public with it.

- No absolute or home paths in tracked files (`/Users/...`). Use repo-relative paths; `~` or `$HOME` only in docs and setup scripts.
- The repo ships code and synthetic data, never the owner's real data. Defaults, seeds, fixtures and mocks are made up. Real snapshots and backups stay gitignored or outside the repo.
- Owner-specific labels (places, pet or people names shown in the UI) come from the app's own data or untracked config, not hardcoded. Names in docs, copy and examples are fine.
- Never commit secrets, tokens, account or artifact IDs. Use placeholders (`<id>`) and env vars.
- Verify with synthetic data. If a real-data check is needed, run it locally and commit only the result, not the data.
- Every clone runs the check on each commit: `dev-home/install-hooks.sh` installs a pre-commit hook that blocks staged lines with home paths, personal emails, artifact IDs, keys or private words (`--no-verify` only when it is meant to be public).
- Before a repo goes public: `dev-home/public-check.sh <repo> --history` must be clean. If history has hits, publish a fresh repo from a squashed commit (or rewrite history) before flipping visibility.
- Private words to scan for (names, places) go in `~/.config/dev-home/private-words`, never in a repo.

### Docs

- Decision records (`docs/adr/`) and design docs (`docs/design/`) use OKF frontmatter with a `type`; `GLOSSARY.md` stays plain. Format and status mapping: dev-home `STANDARDS.md`, "Docs convention".

### Plugins and sessions

- Personal plugin packs (pstack, Pocock, EGM, model-selector) are enabled in user settings (`~/.claude/settings.json`), so they load in every repo. Never add them to a repo's `.claude/settings.json`; declare a plugin there only if the repo can't be worked on without it.
- Start a session in the repo you're changing, so its skills, `.claude/launch.json` and `AGENTS.md` load. Start from dev-home only for work that spans repos.

<!-- dev-home:standards:end -->
