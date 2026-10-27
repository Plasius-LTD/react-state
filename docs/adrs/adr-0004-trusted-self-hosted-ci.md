# ADR 0004: Trusted self-hosted CI

- Status: Accepted
- Date: 2026-10-27
- Work: react-state#21, coordination Story plasius-ltd-site#1626,
  Feature plasius-ltd-site#1597

## Context

The public-release Project requires approved self-hosted validation and hosted
OIDC publication. Both CI jobs and their tests still required `ubuntu-latest`,
so successful releases did not satisfy that requirement. This supersedes only
ADR 0003's hosted CI sentence; its publication controls remain applicable.

## Decision

`ci.yml` accepts repository pushes only. Each job checks the exact repository
identity and push event and selects the fixed `Public CI - Quarantined` group
with `[self-hosted, Linux, X64]`. No caller chooses runners; there is no hosted
fallback, PR trigger, reusable call, manual dispatch or PR-head checkout.

The group admits the repository and `ci.yml@refs/heads/main`. Pre-merge CI may
use a temporarily admitted, reviewed repository branch ref only while branch
protection locks updates for everyone, including administrators, and forbids
fork synchronization. Verify the locked branch's SHA before admission. Remove
the admission before unlocking/deleting or changing that branch; repeat review
and lock verification for any new commit. Patch only `selected_workflows` and
read back both repository IDs and workflow refs; resubmitting visibility can
reset repository selection. Preserve every other repository/group entry and
remove the temporary entry after qualification. The workflow explicitly
selects this group, so an unrestricted Default group is not an alternate route
for these jobs. Organisation-wide runner policy is outside this Task.

Use non-persistent checkout credentials, disabled npm cache finalization, strict
`npm ci`, bounded job timeouts, existing quality/coverage checks and final pack
admission. CI holds read permissions and no production environment or OIDC grant.

Release preparation, queueing, immutable packing and production publication
remain in the existing hosted CD call graph. The scheduled npm audit workflow
is a separate dependency-PR maintenance tool, not CI or qualifying release
evidence; it cannot replace `ci.yml`'s exact-main push result. No CD, maintenance
workflow, package dependency or runtime API is changed.

The inherited stored flag `platform.public-artifact-integrity.enabled` governs
restoration, never mandatory integrity controls. Disabled, missing, malformed or
unavailable state retains containment. Enabled state admits only verified clean
releases. No capability or production env override is introduced.

## Alternatives and consequences

Hosted validation contradicts the Project. Allowing public PR code or
caller-selected capacity expands trust beyond approved repository pushes.
Default-group selection does not provide the workflow allowlist boundary. An
unlocked admitted branch permits code to change after review and is forbidden.
Keep CI unavailable when approved capacity or its exact workflow ref is absent.

## Verification and rollback

Regression tests reject PR/manual/caller-selected/hosted CI, missing isolation
or timeouts and weakened quality gates. The existing artifact admission
checks inspect tree, index and final manifest metadata without reading contributor
records. Full existing package coverage,
lint, types, build, audit and pack checks remain required.

Qualify branch, merged source and pipeline-prepared `main` using genuine push CI;
publish only through `main/cd.yml/production` with npm provenance. Record actual
runner IDs, registry integrity, installed consumers and final Project readback.
Rollback disables the affected workflow or distribution channel and retains a
known clean pointer. Do not restore hosted CI, private records, token publication
or a removed npm version.
