#!/usr/bin/env node
/**
 * Flow conformance check
 *
 * Runs on every Stop hook and in CI. Validates that feature-related artifacts
 * follow the state / file contracts defined in docs/process/.
 *
 * Checks:
 *   - state.md frontmatter schema validation (YAML)
 *   - feature.md frontmatter validation
 *   - feature.md ID registration in Product-Backlog.md
 *   - Required files per state
 *   - State guards: current state vs field consistency (L1 enforcement)
 */

const fs = require("fs");
const path = require("path");

const BACKLOG_DIR = path.join(__dirname, "..", "docs", "backlog");
const REGISTRY_PATH = path.join(BACKLOG_DIR, "Product-Backlog.md");

const VALID_STATES = ["Draft", "Designed", "Implementing", "Testing", "Verified", "Done"];
const VALID_TEST_STATUS = ["N/A", "PENDING", "PASS", "FAIL"];
const VALID_CI_STATUS = ["N/A", "PENDING", "PASS", "FAIL"];

function parseFrontmatter(content) {
  if (!content.startsWith("---")) {
    return { data: null, raw: null, error: "Missing YAML frontmatter" };
  }

  const end = content.indexOf("---", 3);
  if (end === -1) {
    return { data: null, raw: null, error: "Unclosed YAML frontmatter" };
  }

  const raw = content.slice(3, end).trim();
  const data = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    data[key] = value;
  }

  return { data, raw, error: null };
}

function findStateFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const epic of fs.readdirSync(dir)) {
    const epicDir = path.join(dir, epic);
    if (!fs.statSync(epicDir).isDirectory()) continue;

    for (const ft of fs.readdirSync(epicDir)) {
      const ftDir = path.join(epicDir, ft);
      if (!fs.statSync(ftDir).isDirectory()) continue;

      const featureStateFile = path.join(ftDir, "state.md");
      if (fs.existsSync(featureStateFile)) results.push(featureStateFile);

      for (const us of fs.readdirSync(ftDir)) {
        const usDir = path.join(ftDir, us);
        if (!fs.statSync(usDir).isDirectory()) continue;
        if (!us.startsWith("us-")) continue;

        const usStateFile = path.join(usDir, "state.md");
        if (fs.existsSync(usStateFile)) results.push(usStateFile);
      }
    }
  }

  return results;
}

function findFeatureMdFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const epic of fs.readdirSync(dir)) {
    const epicDir = path.join(dir, epic);
    if (!fs.statSync(epicDir).isDirectory()) continue;

    for (const ft of fs.readdirSync(epicDir)) {
      const ftDir = path.join(epicDir, ft);
      if (!fs.statSync(ftDir).isDirectory()) continue;

      const featureMd = path.join(ftDir, "feature.md");
      if (fs.existsSync(featureMd)) results.push(featureMd);
    }
  }

  return results;
}

function checkStateFile(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const rel = path.relative(process.cwd(), filePath);

  const { data, error } = parseFrontmatter(content);
  if (error) {
    issues.push(`${rel}: ${error}`);
    return issues;
  }

  // Required fields for all state.md
  const required = ["type", "level", "epic", "feature", "current", "history"];
  for (const field of required) {
    if (!data[field]) {
      issues.push(`${rel}: Missing required field '${field}'`);
    }
  }

  // type
  if (data.type && data.type !== "state") {
    issues.push(`${rel}: 'type' must be 'state', got '${data.type}'`);
  }

  // level
  if (data.level && !["feature", "us"].includes(data.level)) {
    issues.push(`${rel}: 'level' must be 'feature' or 'us', got '${data.level}'`);
  }

  // current
  if (data.current && !VALID_STATES.includes(data.current)) {
    issues.push(`${rel}: 'current' must be one of [${VALID_STATES.join(", ")}], got '${data.current}'`);
  }

  // level-specific checks
  if (data.level === "us") {
    if (!data.us) {
      issues.push(`${rel}: US-level state.md missing 'us' field`);
    }

    // test_status
    if (data["test_status.p0"] && !VALID_TEST_STATUS.includes(data["test_status.p0"])) {
      issues.push(`${rel}: 'test_status.p0' must be one of [${VALID_TEST_STATUS.join(", ")}]`);
    }
    if (data["test_status.p1"] && !VALID_TEST_STATUS.includes(data["test_status.p1"])) {
      issues.push(`${rel}: 'test_status.p1' must be one of [${VALID_TEST_STATUS.join(", ")}]`);
    }
    if (data["test_status.p2"] && !VALID_TEST_STATUS.includes(data["test_status.p2"])) {
      issues.push(`${rel}: 'test_status.p2' must be one of [${VALID_TEST_STATUS.join(", ")}]`);
    }

    // ci_status
    if (data["ci_status.pr_checks"] && !VALID_CI_STATUS.includes(data["ci_status.pr_checks"])) {
      issues.push(`${rel}: 'ci_status.pr_checks' must be one of [${VALID_CI_STATUS.join(", ")}]`);
    }
    if (data["ci_status.main_checks"] && !VALID_CI_STATUS.includes(data["ci_status.main_checks"])) {
      issues.push(`${rel}: 'ci_status.main_checks' must be one of [${VALID_CI_STATUS.join(", ")}]`);
    }
  }

  // blockers check (recommended for both levels)
  if (!data.blockers) {
    issues.push(`${rel}: Missing 'blockers' field (use 'blockers: []' if empty)`);
  }

  return issues;
}

function checkStateGuards(filePath, data) {
  const issues = [];
  const rel = path.relative(process.cwd(), filePath);
  const level = data.level;
  const current = data.current;

  if (!level || !current) return issues;

  // US-level state guards
  if (level === "us") {
    switch (current) {
      case "Implementing": {
        if (data["ci_status.pr_checks"] === "PASS") {
          issues.push(
            `${rel}: current is 'Implementing' but ci_status.pr_checks is 'PASS'; should be 'Testing'`
          );
        }
        break;
      }
      case "Testing": {
        if (data["ci_status.pr_checks"] === "N/A") {
          issues.push(
            `${rel}: current is 'Testing' but ci_status.pr_checks is 'N/A'; PR must be opened before Testing`
          );
        }
        if (data["test_status.p0"] === "FAIL") {
          issues.push(
            `${rel}: current is 'Testing' but test_status.p0 is 'FAIL'; should revert to 'Implementing'`
          );
        }
        break;
      }
      case "Verified": {
        if (data["test_status.p0"] !== "PASS") {
          issues.push(
            `${rel}: current is 'Verified' but test_status.p0 is '${data["test_status.p0"]}'; must be 'PASS'`
          );
        }
        if (data["ci_status.pr_checks"] !== "PASS") {
          issues.push(
            `${rel}: current is 'Verified' but ci_status.pr_checks is '${data["ci_status.pr_checks"]}'; must be 'PASS'`
          );
        }
        break;
      }
      case "Done": {
        if (data["ci_status.main_checks"] !== "PASS") {
          issues.push(
            `${rel}: current is 'Done' but ci_status.main_checks is '${data["ci_status.main_checks"]}'; must be 'PASS'`
          );
        }
        break;
      }
    }
  }

  // Feature-level state guards
  if (level === "feature") {
    if (current === "Designed") {
      const ftDir = path.dirname(filePath);
      if (fs.existsSync(ftDir)) {
        const usDirs = fs.readdirSync(ftDir).filter((d) => d.startsWith("us-"));
        for (const usDir of usDirs) {
          const usStatePath = path.join(ftDir, usDir, "state.md");
          if (!fs.existsSync(usStatePath)) {
            issues.push(
              `${rel}: feature current is 'Designed' but ${usDir}/state.md is missing`
            );
            continue;
          }
          const usContent = fs.readFileSync(usStatePath, "utf-8");
          const usParsed = parseFrontmatter(usContent);
          if (usParsed.error) continue;
          const usCurrent = usParsed.data.current;
          const validUsStates = ["Designed", "Implementing", "Testing", "Verified", "Done"];
          if (!validUsStates.includes(usCurrent)) {
            issues.push(
              `${rel}: feature current is 'Designed' but ${usDir} current is '${usCurrent}' (must be Designed or later)`
            );
          }
        }
      }
    }
  }

  return issues;
}

function loadRegistryIds() {
  const ids = new Set();

  if (!fs.existsSync(REGISTRY_PATH)) {
    return ids;
  }

  const content = fs.readFileSync(REGISTRY_PATH, "utf-8");

  // Match ft-XXX-slug, td-XXX-slug, bg-XXX-slug patterns in the registry
  const matches = content.matchAll(/\b(ft|td|bg)-\d{3}-[a-z0-9-]+\b/g);
  for (const match of matches) {
    ids.add(match[0]);
  }

  return ids;
}

function checkFeatureMd(filePath, registryIds) {
  const issues = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const rel = path.relative(process.cwd(), filePath);

  const { data, error } = parseFrontmatter(content);
  if (error) {
    issues.push(`${rel}: ${error}`);
    return issues;
  }

  // Required fields
  const required = ["type", "id", "epic", "title", "priority", "owner", "created"];
  for (const field of required) {
    if (!data[field]) {
      issues.push(`${rel}: Missing required field '${field}'`);
    }
  }

  // Forbidden field
  if (data.status) {
    issues.push(`${rel}: Forbidden field 'status' in frontmatter. Use 'current' in state.md instead.`);
  }

  // type
  if (data.type && data.type !== "feature") {
    issues.push(`${rel}: 'type' should be 'feature', got '${data.type}'`);
  }

  // ID registration check
  if (data.id) {
    const idPattern = /^(ft|td|bg)-\d{3}-[a-z0-9-]+$/;
    if (!idPattern.test(data.id)) {
      issues.push(`${rel}: Invalid ID format '${data.id}'. Expected: ft-XXX-slug / td-XXX-slug / bg-XXX-slug`);
    } else if (!registryIds.has(data.id)) {
      issues.push(`${rel}: ID '${data.id}' not registered in Product-Backlog.md. Run: node scripts/allocate-id.js ${data.id.split("-")[0]} <slug>`);
    }
  }

  return issues;
}

function checkRequiredFilesPerState() {
  const issues = [];
  if (!fs.existsSync(BACKLOG_DIR)) return issues;

  for (const epic of fs.readdirSync(BACKLOG_DIR)) {
    const epicDir = path.join(BACKLOG_DIR, epic);
    if (!fs.statSync(epicDir).isDirectory()) continue;

    for (const ft of fs.readdirSync(epicDir)) {
      const ftDir = path.join(epicDir, ft);
      if (!fs.statSync(ftDir).isDirectory()) continue;

      const stateFile = path.join(ftDir, "state.md");
      if (!fs.existsSync(stateFile)) continue;

      const content = fs.readFileSync(stateFile, "utf-8");
      const { data } = parseFrontmatter(content);
      if (!data) continue;

      const current = data.current;

      // Designed+ must have feature.md
      if (["Designed", "Implementing", "Testing", "Verified", "Done"].includes(current)) {
        if (!fs.existsSync(path.join(ftDir, "feature.md"))) {
          issues.push(`docs/backlog/${epic}/${ft}: state '${current}' requires feature.md`);
        }
      }

      // Testing+ must have test-report.md at feature or US level
      if (["Testing", "Verified", "Done"].includes(current)) {
        const hasTestReport =
          fs.existsSync(path.join(ftDir, "test-report.md")) ||
          fs.readdirSync(ftDir).some((us) => {
            if (!us.startsWith("us-")) return false;
            return fs.existsSync(path.join(ftDir, us, "test-report.md"));
          });

        if (!hasTestReport) {
          issues.push(`docs/backlog/${epic}/${ft}: state '${current}' requires test-report.md`);
        }
      }

      // Check US-level states
      for (const us of fs.readdirSync(ftDir)) {
        const usDir = path.join(ftDir, us);
        if (!fs.statSync(usDir).isDirectory()) continue;
        if (!us.startsWith("us-")) continue;

        const usStateFile = path.join(usDir, "state.md");
        if (!fs.existsSync(usStateFile)) continue;

        const usContent = fs.readFileSync(usStateFile, "utf-8");
        const { data: usData } = parseFrontmatter(usContent);
        if (!usData) continue;

        const usCurrent = usData.current;

        if (["Testing", "Verified", "Done"].includes(usCurrent)) {
          if (!fs.existsSync(path.join(usDir, "test-report.md"))) {
            issues.push(`docs/backlog/${epic}/${ft}/${us}: state '${usCurrent}' requires test-report.md`);
          }
        }
      }
    }
  }

  return issues;
}

function main() {
  const issues = [];

  // Load registry once
  const registryIds = loadRegistryIds();

  // Check state.md files
  const stateFiles = findStateFiles(BACKLOG_DIR);
  for (const f of stateFiles) {
    issues.push(...checkStateFile(f));
    const content = fs.readFileSync(f, "utf-8");
    const { data, error } = parseFrontmatter(content);
    if (!error && data) {
      issues.push(...checkStateGuards(f, data));
    }
  }

  // Check feature.md files
  const featureFiles = findFeatureMdFiles(BACKLOG_DIR);
  for (const f of featureFiles) {
    issues.push(...checkFeatureMd(f, registryIds));
  }

  // Check required files per state
  issues.push(...checkRequiredFilesPerState());

  if (issues.length === 0) {
    console.log("[flow-check] all ok");
    process.exit(0);
  } else {
    console.log("[flow-check] FAILED");
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
    process.exit(1);
  }
}

main();
