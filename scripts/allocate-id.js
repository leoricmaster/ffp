#!/usr/bin/env node
/**
 * ID Allocation Script
 *
 * Allocates ft/td/bg IDs with conflict checking against the registry and repository.
 *
 * Usage:
 *   node scripts/allocate-id.js <type> <slug>
 *
 *   <type>: ft | td | bg
 *   <slug>: kebab-case short description
 *
 * Examples:
 *   node scripts/allocate-id.js ft create-income
 *   node scripts/allocate-id.js td openapi-categories
 *   node scripts/allocate-id.js bg login-redirect-loop
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REGISTRY_PATH = path.join(__dirname, "..", "docs", "backlog", "Product-Backlog.md");

const VALID_TYPES = ["ft", "td", "bg"];
const TYPE_LABELS = {
  ft: "Feature",
  td: "Tech Debt",
  bg: "Bug",
};

function logInfo(msg) {
  console.log(`[id-allocation] ${msg}`);
}

function logError(msg) {
  console.error(`[id-allocation] ERROR: ${msg}`);
}

function validateArgs(type, slug) {
  if (!type || !slug) {
    logError("Missing required arguments: <type> <slug>");
    console.log("Usage: node scripts/allocate-id.js <type> <slug>");
    console.log(`  <type>: ${VALID_TYPES.join(" | ")}`);
    console.log("  <slug>: kebab-case short description");
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type)) {
    logError(`Invalid type '${type}'. Must be one of: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    logError(
      `Invalid slug '${slug}'. Must be kebab-case (lowercase letters, numbers, hyphens only).`
    );
    process.exit(1);
  }
}

function parseRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    logError(`Registry not found: ${REGISTRY_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(REGISTRY_PATH, "utf-8");
  const counters = { ft: 0, td: 0, bg: 0 };

  for (const type of VALID_TYPES) {
    // Match rows like: | `ft` | Feature | 3 |  or  | ft | Tech Debt | 0 |
    // Captures the number in group 2
    const regex = new RegExp(`(^\\s*\\|\\s*\`?${type}\`?\\s*\\|[^|]+\\s*\\|\\s*)(\\d+)(\\s*\\|)`, "m");
    const match = content.match(regex);
    if (match) {
      counters[type] = parseInt(match[2], 10);
    }
  }

  return counters;
}

function updateRegistry(type, nextNum) {
  const content = fs.readFileSync(REGISTRY_PATH, "utf-8");
  const regex = new RegExp(`(^\\s*\\|\\s*\`?${type}\`?\\s*\\|[^|]+\\s*\\|\\s*)(\\d+)(\\s*\\|)`, "m");

  if (!regex.test(content)) {
    logError(
      `Registry entry for '${type}' not found. Add a row for this type in Product-Backlog.md.`
    );
    process.exit(1);
  }

  const updated = content.replace(regex, `$1${nextNum}$3`);
  fs.writeFileSync(REGISTRY_PATH, updated, "utf-8");
  logInfo(`Registry updated: ${type} max → ${nextNum}`);
}

function checkRepositoryConflict(type, proposedId) {
  try {
    const result = execSync(
      `grep -r "${proposedId}" /Users/lancer/Codes/ffp --include="*.md" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.yaml" -l 2>/dev/null | grep -v "node_modules" | grep -v ".git"`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    if (result.trim()) {
      const files = result
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((f) => path.relative(process.cwd(), f))
        .slice(0, 5);

      logError(
        `ID '${proposedId}' already referenced in repository:\n  ${files.join("\n  ")}${
          result.split("\n").length > 5 ? "\n  ..." : ""
        }`
      );
      logError("Correct the registry or choose a different slug.");
      process.exit(1);
    }
  } catch (err) {
    // grep returns exit code 1 when no matches — this is ok
    if (err.status !== 1 && err.stdout !== "") {
      // Non-empty stdout means matches were found (already handled above)
      // If we get here with status 0 and empty stdout, no conflicts
    }
  }
}

function main() {
  const type = process.argv[2];
  const slug = process.argv[3];

  validateArgs(type, slug);

  logInfo(`Allocating ${TYPE_LABELS[type]} ID...`);

  const counters = parseRegistry();
  const nextNum = counters[type] + 1;
  const proposedId = `${type}-${String(nextNum).padStart(3, "0")}-${slug}`;

  logInfo(`Checking for conflicts in repository...`);
  checkRepositoryConflict(type, proposedId);

  logInfo(`Registering in Product-Backlog.md...`);
  updateRegistry(type, nextNum);

  logInfo(`✅ ID allocated: ${proposedId}`);
  console.log(proposedId);
}

main();