# Security assessment

Assessment date: 2026-10-23. Source baseline: `dee4a5f`. This report covers the accompanying dependency and CI maintenance changes.

## Scope and trust boundaries

This package traverses in-memory JavaScript values. It has no runtime dependencies, HTTP endpoints, database, authentication, session storage, or built-in network requests.
The review covers `index.js`, `index.d.ts`, tests, package metadata, the lockfile, CI, and reachable Git history.

The main assets are the host process's availability, the integrity of traversal results, and CI credentials.
Input trees and mapper results cross into traversal. Getters, proxies, and mapper functions execute with the caller's privileges.
Dependency installation and third-party Actions cross into the build environment. The coverage action receives the workflow token.

## Findings and disposition

The original lockfile reported 10 high-severity vulnerable packages, all in development dependencies.
The updated lockfile reports 5 high-severity packages from one remaining advisory. The runtime audit reports zero vulnerabilities.
These are package counts, not counts of distinct CVEs.

| Finding | Exposure | Disposition |
| --- | --- | --- |
| High: vulnerable development dependency tree | Original findings included glob-pattern denial of service, lodash code injection, and YAML prototype pollution. These packages are absent from the published runtime graph. | Updated AVA 5.3.1 to 8.1.1 and c8 8.0.1 to 12.0.0. Refreshed compatible transitives, including lodash and js-yaml. |
| High advisory, limited local exposure: unpatched braces | AVA → globby → fast-glob → micromatch → braces, with an additional globby → micromatch edge. Crafted glob patterns can exhaust the call stack. | Deferred: braces 3.0.3 is the latest published release and has no patch. Five audit entries represent braces and its dependent packages. |
| Medium, conditional: unbounded traversal resources | A 10,000-level object rejects with `RangeError` when traversed without a mapper. Large inputs or mapper-generated trees can also consume unbounded memory or time. | Open: README documents input depth/size validation and worker termination deadlines. No traversal limit or cancellation API was introduced. |
| Medium: mutable CI dependencies and implicit token permissions | Coverage previously used `@master`; checkout and setup-node used mutable major tags. Repository defaults determined token permissions. | Actions now use verified release commit hashes. Workflow permissions explicitly grant only `contents: read`. Checkout retains `persist-credentials: false`. |
| Low: installation scripts and accidental secret inclusion | Dependency lifecycle scripts ran during CI installation. Environment and private-key files lacked ignore rules. | `.npmrc` disables install scripts. CI explicitly uses `npm ci --ignore-scripts`. Ignore rules now cover environment files and private keys. |

The remaining dependency advisory is [CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The advisory lists all braces releases through 3.0.3 as affected and no patched version.
The package never sends traversal input to AVA's glob matcher. Exposure requires development tools to process attacker-controlled glob patterns.
Pull requests already execute repository test code, so CI must treat that code as untrusted regardless of this advisory.
No exploit through this library's runtime API was identified.

Review this deferral by **2026-11-23**, before the next release, or when a braces patch becomes available, whichever comes first.
The decision to retain AVA avoids an unrelated test-framework migration. No forced audit remediation or incompatible transitive override was applied.
`npm run audit` still exits nonzero. CI reports that full audit as an advisory step and gates runtime dependencies separately.

## OWASP coverage

This mapping uses the [OWASP Top 10:2025](https://top10.owasp.org/2025/) and [OWASP API Security Top 10:2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/).
It describes applicability to this library, not certification of applications that use it.

| OWASP Top 10:2025 category | Assessment |
| --- | --- |
| A01 Broken access control | No protected resources or authorization system. Callers must authorize data before traversal. |
| A02 Security misconfiguration | CI permissions and install scripts hardened. Server headers, CORS, and cookies do not apply. |
| A03 Software supply chain failures | Lockfile audited, dependencies updated, Actions pinned, registry signatures verified. One unpatched development advisory remains. |
| A04 Cryptographic failures | No cryptographic operations or sensitive-data storage. |
| A05 Injection | No eval, shell execution, query construction, or HTML sinks in library code. Special-key checks preserved the result prototype. |
| A06 Insecure design | Conditional resource-exhaustion risk remains. Mappers and executable object behavior must be trusted. |
| A07 Authentication failures | No authentication implementation. |
| A08 Software or data integrity failures | Frozen installs and immutable Action references reduce build tampering risk. Runtime output preserves own special keys in the exercised cases. |
| A09 Security logging and alerting failures | No hosted service or security event store. Callers must handle failures and log suitable context without secrets. |
| A10 Mishandling of exceptional conditions | Mapper failures propagate as rejected promises. Deep input can reject with stack exhaustion. Callers need error and resource boundaries. |

| OWASP API Security Top 10:2023 category | Assessment |
| --- | --- |
| API1 Broken object level authorization | No endpoints or object ownership model. Authorization belongs to the host application. |
| API2 Broken authentication | No API authentication. |
| API3 Broken object property level authorization | Traversal copies enumerable fields. It is not an allowlist serializer; callers must remove sensitive properties before responding. |
| API4 Unrestricted resource consumption | Applicable when a host API accepts unbounded trees. See the open resource-exhaustion finding. |
| API5 Broken function level authorization | No endpoint dispatch or role model. |
| API6 Unrestricted access to sensitive business flows | No business workflows. |
| API7 Server side request forgery | No built-in fetches. README fetch examples require caller-enforced URL restrictions and timeouts. |
| API8 Security misconfiguration | Repository CI reviewed. No API deployment configuration exists. |
| API9 Improper inventory management | No deployed API inventory. Public exports are `traverse`, `STOP`, and `REMOVE`. |
| API10 Unsafe consumption of APIs | No built-in external API clients. Callers must validate mapper inputs and external responses. |

## Secret scan

A local pattern scan examined all 50 unique historical file blobs reachable through `git rev-list --objects --all`.
Patterns covered private-key headers, AWS access keys, GitHub/GitLab/Slack tokens, credential assignments, and URLs containing credentials.
No matches were found. Scan output contained only file metadata, never candidate secret values.

This was a custom pattern scan, not Gitleaks or TruffleHog. Neither tool was installed.
The scan cannot rule out arbitrary high-entropy secrets, deleted unreachable Git objects, remote-only refs, or external CI settings.
Public author metadata and GitHub's `${{ secrets.github_token }}` expression are not exposed credential values.

## Repository health context

The last year's changes were limited to package metadata, the lockfile, and type declarations.
Only `index.d.ts` appeared in bug-fix history. No reverts, hotfixes, or emergency commits appeared in the last year.
All 33 commits were attributed to one author, with none in the last six months. This creates a single-maintainer continuity risk.

Fallow 3.35.0 reported no dead code, circular dependencies, or duplicated production code.
The largest production function had cyclomatic complexity 13. Recent history was too sparse for meaningful churn/complexity hotspot ranking.
Initial analysis ran before installation, which limited dependency resolution. Architecture boundary policies were not configured.
The most useful review targets were `index.js` for recursion and `package-lock.json` plus `.github/workflows/main.yml` for supply-chain exposure.

## Verification and limits

Validation on Node.js 24.22.0 with npm 11.19.1 produced these results:

- Clean `npm ci --ignore-scripts` completed. The lockfile contains no packages marked with install scripts.
- `npm run test:ci` passed all 11 tests, with 97.01% statement coverage and 85.18% branch coverage.
- `npm audit signatures` verified registry signatures for 170 packages and attestations for 16 packages.
- `npm run audit:runtime` reported zero vulnerabilities. The full audit retained the five documented high-severity development entries.
- Direct checks for JSON `__proto__` and `constructor.prototype` keys preserved own data and did not change result or global prototypes.
- The deep-input reproduction confirmed the open stack-exhaustion finding.

The library implementation and runtime engine declaration remain unchanged. Updated AVA requires Node.js 22.20+, 24.12+, or 26+.
CI now targets Node.js 22, 24, and 26 on Linux and Windows. Only the local Node.js 24 run was executed during this assessment.
The declared Node.js 16+ runtime range is no longer covered by the CI test matrix.

This assessment does not cover downstream applications, remote repository security settings, or unknown vulnerabilities in otherwise signed packages.
