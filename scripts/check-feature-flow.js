#!/usr/bin/env node
/**
 * Flow conformance check — placeholder (Wave 5-5).
 *
 * Runs on every Stop hook and in CI. Checks that feature-related artifacts
 * follow the state / file contracts defined in docs/process/.
 *
 * TODO: Implement full checks:
 *   - state.md frontmatter schema validation (YAML type/feature_id/epic/current/history/ci_status/test_status)
 *   - feature.md frontmatter validation
 *   - design.md > 150 lines → should exist as separate file
 *   - OpenAPI vs design.md consistency
 *   - Required files per state (e.g., Testing must have test-report.md)
 *
 * For now: green if no obvious drift detected.
 */

const fs = require("fs");
const path = require("path");

const BACKLOG_DIR = path.join(__dirname, "..", "docs", "backlog");

function findStateFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const epic of fs.readdirSync(dir)) {
    const epicDir = path.join(dir, epic);
    if (!fs.statSync(epicDir).isDirectory()) continue;
    for (const ft of fs.readdirSync(epicDir)) {
      const ftDir = path.join(epicDir, ft);
      if (!fs.statSync(ftDir).isDirectory()) continue;
      const stateFile = path.join(ftDir, "state.md");
      if (fs.existsSync(stateFile)) results.push(stateFile);
    }
  }
  return results;
}

function checkStateFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  // Minimal check: must have YAML frontmatter
  if (!content.startsWith("---")) {
    return `Missing YAML frontmatter: ${path.relative(process.cwd(), filePath)}`;
  }
  return null;
}

function main() {
  const issues = [];

  const stateFiles = findStateFiles(BACKLOG_DIR);
  for (const f of stateFiles) {
    const issue = checkStateFile(f);
    if (issue) issues.push(issue);
  }

  if (issues.length === 0) {
    console.log("[flow-check] all ok");
    process.exit(0);
  } else {
    console.log("[flow-check] FAILED");
    for (const i of issues) console.log(`  - ${i}`);
    process.exit(1);
  }
}

main();
