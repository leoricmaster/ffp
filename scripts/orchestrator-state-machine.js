#!/usr/bin/env node
/**
 * Orchestrator state machine (L1 enforcement)
 *
 * Reads a US-level state.md and recommends the next action based on the
 * feature-flow state machine defined in docs/process/.
 *
 * Usage:
 *   node scripts/orchestrator-state-machine.js --us-path docs/backlog/epic-XXX/ft-XXX/us-XXX
 *
 * Exit codes:
 *   0 - success (output is valid JSON)
 *   1 - input error (missing args, file not found, parse error)
 *   2 - state machine violation (should never happen if check-feature-flow.js passes)
 */

const fs = require("fs");
const path = require("path");

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

function readState(usPath) {
  if (!fs.existsSync(usPath)) {
    return { error: `State file not found: ${usPath}` };
  }

  const content = fs.readFileSync(usPath, "utf-8");
  const { data, error } = parseFrontmatter(content);

  if (error) {
    return { error: `Parse error in ${usPath}: ${error}` };
  }

  if (data.level !== "us") {
    return { error: `Expected level=us, got level=${data.level}` };
  }

  return { data, error: null };
}

function checkDependencies(usDir) {
  const warnings = [];
  const blockers = [];

  // Look for dependency declarations in the US directory
  const usMdPath = path.join(usDir, "us.md");
  if (fs.existsSync(usMdPath)) {
    const content = fs.readFileSync(usMdPath, "utf-8");
    const depMatch = content.match(/depends_on:\s*\n((?:\s+-\s+us-[^\n]+\n?)*)/);
    if (depMatch) {
      const deps = depMatch[1].match(/us-\d{3}-[a-z0-9-]+/g) || [];
      for (const depUs of deps) {
        const depStatePath = path.join(path.dirname(usDir), depUs, "state.md");
        if (!fs.existsSync(depStatePath)) {
          blockers.push(`Dependency ${depUs} state.md not found`);
          continue;
        }
        const depContent = fs.readFileSync(depStatePath, "utf-8");
        const depParsed = parseFrontmatter(depContent);
        if (depParsed.error) {
          warnings.push(`Could not parse dependency ${depUs} state.md`);
          continue;
        }
        if (depParsed.data.current !== "Done") {
          blockers.push(`Dependency ${depUs} not Done (current: ${depParsed.data.current})`);
        }
      }
    }
  }

  return { blockers, warnings };
}

function evaluateStateMachine(data, usDir) {
  const current = data.current;
  const result = {
    current,
    action: null,
    next_state: null,
    invoke: null,
    reason: null,
    blockers: [],
    warnings: [],
  };

  // Check explicit blockers in state
  try {
    const blockersField = data.blockers || "[]";
    const blockers = JSON.parse(blockersField.replace(/'/g, '"'));
    if (Array.isArray(blockers) && blockers.length > 0) {
      result.blockers.push(...blockers);
      result.action = "skip";
      result.reason = `Explicit blockers: ${blockers.join(", ")}`;
      return result;
    }
  } catch {
    result.warnings.push("Could not parse blockers field");
  }

  // Check US dependencies
  const deps = checkDependencies(usDir);
  if (deps.blockers.length > 0) {
    result.blockers.push(...deps.blockers);
    result.action = "skip";
    result.reason = `Dependency blockers: ${deps.blockers.join(", ")}`;
    return result;
  }
  result.warnings.push(...deps.warnings);

  // Check CI pending
  const prChecks = data["ci_status.pr_checks"] || "N/A";
  if (prChecks === "PENDING") {
    result.action = "wait";
    result.reason = "PR CI checks are PENDING";
    return result;
  }

  // State machine transitions (matching orchestrator.md Step 5)
  switch (current) {
    case "Designed": {
      result.action = "invoke_agent";
      result.next_state = "Implementing";
      result.invoke = ["developer"];
      result.reason = "US is Designed and ready for implementation";
      break;
    }

    case "Implementing": {
      if (prChecks === "PASS") {
        result.action = "transition";
        result.next_state = "Testing";
        result.invoke = ["tester"];
        result.reason = "PR CI is PASS, ready for testing";
      } else if (prChecks === "FAIL") {
        result.action = "escalate";
        result.reason = "PR CI failed while in Implementing state";
        result.blockers.push("PR CI failed");
      } else {
        result.action = "wait";
        result.reason = "Waiting for PR CI to complete";
      }
      break;
    }

    case "Testing": {
      const p0Status = data["test_status.p0"] || "N/A";

      if (p0Status === "FAIL") {
        result.action = "revert";
        result.next_state = "Implementing";
        result.invoke = ["developer"];
        result.reason = "P0 tests FAILED, revert to Implementing for fixes";
      } else if (p0Status === "PASS") {
        // P0 PASS but need reviewer approval - this is an L2 check that
        // Orchestrator must perform by reading PR review state
        result.action = "needs_external_check";
        result.reason = "P0 PASS, need reviewer approval check (external)";
      } else if (p0Status === "PENDING") {
        result.action = "wait";
        result.reason = "P0 tests are PENDING";
      } else {
        result.action = "wait";
        result.reason = "Waiting for P0 test results";
      }
      break;
    }

    case "Verified": {
      // Verified -> Done requires human gate (user approval)
      result.action = "needs_human_gate";
      result.reason = "User acceptance gate required (Verified -> Done)";
      break;
    }

    case "Done": {
      result.action = "skip";
      result.reason = "US is Done";
      break;
    }

    default: {
      result.action = "error";
      result.reason = `Unknown state: ${current}`;
      break;
    }
  }

  return result;
}

function main() {
  const usPathFlag = process.argv.indexOf("--us-path");
  if (usPathFlag === -1 || !process.argv[usPathFlag + 1]) {
    console.error("Usage: node orchestrator-state-machine.js --us-path <path-to-us-state.md>");
    process.exit(1);
  }

  const usPath = path.resolve(process.argv[usPathFlag + 1]);
  const usDir = path.dirname(usPath);

  const { data, error } = readState(usPath);
  if (error) {
    console.error(`[state-machine] ERROR: ${error}`);
    process.exit(1);
  }

  // Validate state value
  if (!VALID_STATES.includes(data.current)) {
    console.error(`[state-machine] ERROR: Invalid state '${data.current}'`);
    process.exit(1);
  }

  const result = evaluateStateMachine(data, usDir);

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main();
