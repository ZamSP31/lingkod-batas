# Stage 1 baseline and rollback record

Owner authorization: Stage 1 only. No production logic, schema, frontend,
dependencies, Git commits, deployment, or later stages are authorized here.

## Git baseline

- Branch: `main`
- HEAD: `4d836c55d761dabe3c5304c51cac7c40641f1ff3`
- Node runtime inspected: `v25.4.0`
- Index: no staged changes at start.
- `server/package.json` was clean at start; its original Git blob is
  `7ce1f5c834b87d2975d0cb4d43521b1811c23f8f`.
- Existing tracked change: deleted `HANDOFF.md` (160 lines). Leave it deleted.
- Existing untracked files, preserved:
  - `AGENTS.md`
  - `docs/PROJECT_IMPROVEMENT_PLAN.md`
  - `docs/audit/01-system-inventory.md`
  - `docs/audit/02-backend-audit.md`
  - `docs/audit/03-frontend-audit.md`
  - `docs/audit/04-nfr-security-audit.md`
  - `docs/audit/FINAL_SCRUM_AUDIT_REPORT.md`

Initial untracked-file SHA256 fingerprints recorded during Stage 1:

| File | SHA256 |
| --- | --- |
| AGENTS.md | 91D43A41172DF364C754254668690BF71BD84443158216AD4ED78571D0657C10 |
| docs/PROJECT_IMPROVEMENT_PLAN.md | E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855 |
| docs/audit/01-system-inventory.md | 7D05893AA307D376E28029744FAA0F17067A9FCEAB203F59F46E5E107B648BFB |
| docs/audit/02-backend-audit.md | 54C3E5D56EED1BDA97D73A77C97C0E98232B032CA677007A79268C80A2F99B79 |
| docs/audit/03-frontend-audit.md | E9A4A9978A002E70A6EDB7BDC99C5A8742D78A27CAF1AD278D430F3C3B8AE841 |
| docs/audit/04-nfr-security-audit.md | 2A54FF36F4F8F697FD61512DB7F261A8DDCC3673274E2EB1E0F5ACCC718392F5 |
| docs/audit/FINAL_SCRUM_AUDIT_REPORT.md | F2A25AB78FC5C589BD1FBEB09AA8B13C806844926DF01C24EC88A9D2A1987D73 |

## Stage-owned files

Modified: `server/package.json`, adding only `test: node --test test/*.test.js`.

Created:

- `server/test/helpers/isolatedHarness.js`
- `server/test/authorization.test.js`
- `server/test/contractVisibility.test.js`
- `server/test/isolation.test.js`
- `server/test/reviewCompletion.test.js`
- `server/test/releasedReport.test.js`
- `server/test/reviewConsistency.test.js`
- `server/test/STAGE1_BASELINE.md`

## Execution and interpretation

From `server/`, the approved command is `node --test test/*.test.js`.
The package test command invokes exactly that command, with no installation.

Tests evaluate the actual reviewed controller/middleware/route source through
a closed CommonJS loader in a VM context. They do not import the application
entry point or load SDKs. Models are synthetic in-memory adapters. JWT verification,
Express wrappers/router registration, and integration boundaries are mocked.
The context supplies only a synthetic environment, not real environment values.
No network/server/socket is started; no database connection is available.
Unmapped dependencies and Cloudinary/email/OCR/AI attempts throw explicit
isolation errors. Audit/notification calls are recorded in memory. Invocation
checks also reject swallowed isolation errors. Background tasks are rejected.

This is a controlled loader for reviewed application code, not a general-purpose
security sandbox for arbitrary hostile JavaScript. Mocked query projections and
references approximate only the operations needed by these tests.

Known defects execute desired-behavior assertions using Node TODO status.
They remain failing targets and do not count as passing protections. Node can
exit zero with failing TODO tests; always inspect pass/fail/TODO counts.
Remove TODO only after the corresponding stage is approved and the protection
is verified. Open business questions have not been turned into invented tests.

Not covered: real JWT cryptography, Express HTTP transport, actual Mongoose
validation/population/transactions, live integrations, frontend rendering,
concurrency guarantees, zero-clause policy, dismissal/risk policy, or revisions.

## Rollback (instructions only; not executed)

1. Review the current diff for later owner changes before restoring anything.
2. Remove only the added `test` property from `server/package.json`. The original
   version is recoverable from the baseline HEAD/blob; do not overwrite later edits.
3. If rollback is authorized, remove only the eight stage-created files listed
   above after verifying their resolved paths are inside this workspace. Retain
   this record elsewhere if required before its removal.
4. Do not restore `HANDOFF.md`, delete existing untracked documents, reset the
   repository, stash changes, or touch any data store.

No database rollback or migration is needed.

## Final review observations

The worktree changed independently during the investigation. Final status also
showed deletions of `CLAUDE.md`, `docs/CAPSTONE_RAG_BENCHMARK_REPORT.md`,
`docs/UI_PROMPT_GUIDE.md`, and `docs/mockups/lingkod-batas-my-contracts.html`.
The initially untracked improvement-plan/audit files were no longer listed.
Stage 1 did not edit or remove these files. Their actor/cause is unknown; do not
restore or delete them as part of Stage 1 rollback. The original baseline above
records the state at the start, rather than asserting the entire worktree stayed
unchanged. `AGENTS.md` and the pre-existing `HANDOFF.md` deletion remained listed.

The only stage-owned tracked diff is the one-line package test command. All
Stage 1 implementation files are new and untracked. `git diff --check` passed.

Final suite: 32 tests, 25 passing baselines/isolation checks, 7 executed failing
TODO regression targets, 0 ordinary failures, 0 skipped, 0 cancelled. The command
exits zero because known failing targets are TODO, not because they are fixed.
An initial harness ObjectId-fixture mismatch caused one ordinary failure; the
synthetic reference was corrected without production changes and reruns passed.
