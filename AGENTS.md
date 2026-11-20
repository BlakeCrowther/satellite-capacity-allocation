# satellite-capacity-allocation

<!-- dev-home:standards:start -->
<!-- Managed by dev-home sync-standards.sh. Edit repo-rules.md in dev-home, not here. -->

## Standards

Shared across Blake's repos. Repo-specific sections of this file override these rules.

### Commands

Exact commands are listed elsewhere in this file. Every repo has `setup`, `dev`, `lint`, `typecheck`, `test`, `verify`; `services` if it has backing services.

- Fresh worktree or sandbox: run `setup` first. It never starts services.
- Start services only when the task needs them (`services`, or `dev`).
- Never hardcode ports. HTTP via portless (`PORT`); databases via `*_URL` vars in `.env`.
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

<!-- dev-home:standards:end -->
