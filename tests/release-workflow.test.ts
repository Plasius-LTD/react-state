import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readWorkflow = (name: string): string =>
  readFileSync(resolve(process.cwd(), `.github/workflows/${name}.yml`), "utf8");
const cdWorkflow = readWorkflow("cd");
const ciWorkflow = readWorkflow("ci");
const packageMetadata = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
) as { repository: { url: string } };
const repositoryFullName = new URL(packageMetadata.repository.url.replace(/^git\+/u, ""))
  .pathname.replace(/^\//u, "").replace(/\.git$/u, "");

describe("package release trust boundary", () => {
  it("uses exact-main hosted OIDC publication without write tokens", () => {
    expect(cdWorkflow).toContain("runs-on: ubuntu-latest");
    expect(cdWorkflow).toContain("environment: production");
    expect(cdWorkflow).toContain("id-token: write");
    expect(cdWorkflow).toContain("Enforce exact-main successful CI");
    expect(cdWorkflow).toContain("refs/remotes/origin/main");
    expect(cdWorkflow).toContain("-f branch=main");
    expect(cdWorkflow).toContain("-f event=push");
    expect(cdWorkflow).toContain('-f head_sha="${EXPECTED_SHA}"');
    expect(cdWorkflow).toContain('conclusion == "success"');
    expect(cdWorkflow).toContain("Verify release runtime");
    expect(cdWorkflow).toContain('ACTUAL_NODE%%.*');
    expect(cdWorkflow).toContain('"11.5.1"');
    expect(cdWorkflow).toContain("--provenance");
    expect(cdWorkflow).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/u);
  });

  it("accepts only trusted repository pushes for public self-hosted CI", () => {
    const triggers = ciWorkflow.split("permissions:")[0];
    expect(triggers).toContain("push:");
    expect(triggers).toContain('branches: ["**"]');
    expect(triggers).not.toMatch(/pull_request|workflow_dispatch|workflow_call|workflow_run/u);
    expect(ciWorkflow).not.toContain("pull_request_target");
    expect(ciWorkflow).not.toContain("fromJSON(");
    expect(ciWorkflow).not.toContain("ubuntu-latest");
    expect(ciWorkflow).not.toContain("secrets: inherit");
  });

  it("isolates every validation job on approved self-hosted capacity", () => {
    const jobs = (ciWorkflow.split("jobs:\n")[1] ?? "")
      .split(/(?=^ {2}[a-z_][a-z_0-9-]*:\n)/gmu)
      .filter((job) => /^ {2}[a-z_][a-z_0-9-]*:\n/u.test(job));
    expect(jobs).toHaveLength(2);
    for (const job of jobs) {
      expect(job).toContain("github.event_name == 'push'");
      expect(job).toContain(`github.repository == '${repositoryFullName}'`);
      expect(job).toMatch(/runs-on:\n {6}group: Public CI - Quarantined\n {6}labels: \[self-hosted, Linux, X64\]/u);
      expect(job.match(/runs-on:/gu)).toHaveLength(1);
      expect(job).toMatch(/timeout-minutes: (10|15)\n/u);
      expect(job).toContain("persist-credentials: false");
      expect(job).toContain("package-manager-cache: false");
      expect(job).not.toMatch(/\n\s+cache:\s*["']?npm["']?/u);
      expect(job).not.toContain("id-token: write");
      expect(job).not.toContain("contents: write");
    }
  });

  it("retains reproducible install, quality, coverage and final-artifact gates", () => {
    expect(ciWorkflow).toMatch(/run: npm ci\s*\n/u);
    for (const command of ["npm run lint", "npm run typecheck", "npm run audit:npm",
      "npm run build", "npm run test:coverage", "npm run pack:check"]) {
      expect(ciWorkflow).toContain(command);
    }
    expect(ciWorkflow).toContain("Enforce line coverage >= 80%");
    expect(ciWorkflow).toContain("Verify public artifact integrity");
    expect(ciWorkflow).not.toContain("--legacy-peer-deps");
  });
});
