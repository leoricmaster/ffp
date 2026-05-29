#!/usr/bin/env node
/**
 * Self-test for allocate-id.js
 *
 * Tests the happy path and error cases.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const SCRIPT = path.join(__dirname, "allocate-id.js");
const REGISTRY = path.join(__dirname, "..", "docs", "backlog", "Product-Backlog.md");

let passed = 0;
let failed = 0;

function log(msg) {
  console.log(`  ${msg}`);
}

function assert(condition, msg) {
  if (condition) {
    log(`✅ ${msg}`);
    passed++;
  } else {
    log(`❌ ${msg}`);
    failed++;
  }
}

function run(args) {
  return new Promise((resolve) => {
    const child = spawn("node", [SCRIPT, ...args], { encoding: "utf-8" });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function getRegistry() {
  const content = fs.readFileSync(REGISTRY, "utf-8");
  const result = {};
  for (const type of ["ft", "td", "bg"]) {
    // Match: | `ft` | Feature | 0 | or | ft | Tech Debt | 0 |
    const match = content.match(new RegExp(`\`?${type}\`?\\s*\\|[^|]+\\|\\s*(\\d+)\\s*\\|`));
    result[type] = match ? parseInt(match[1], 10) : 0;
  }
  return result;
}

async function main() {
  console.log("\n=== allocate-id.js self-test ===\n");

  // Backup registry
  const registryBackup = fs.readFileSync(REGISTRY, "utf-8");

  try {
    // Ensure ID registry table exists
    ensureRegistryTable();
    ensureRegistryTable(); // call twice to handle idempotency

    // Test 1: missing args
    {
      const r = await run([]);
      assert(r.code !== 0 && r.stderr.includes("Missing required arguments"), "missing args → exit non-zero + error message");
    }

    // Test 2: invalid type
    {
      const r = await run(["xx", "test"]);
      assert(r.code !== 0 && r.stderr.includes("Invalid type"), "invalid type → exit non-zero + error message");
    }

    // Test 3: invalid slug (has spaces)
    {
      const r = await run(["ft", "has spaces"]);
      assert(r.code !== 0 && r.stderr.includes("kebab-case"), "invalid slug (spaces) → exit non-zero + error message");
    }

    // Test 4: invalid slug (uppercase)
    {
      const r = await run(["ft", "UPPER"]);
      assert(r.code !== 0 && r.stderr.includes("kebab-case"), "invalid slug (uppercase) → exit non-zero + error message");
    }

    // Test 5: happy path ft
    {
      const before = getRegistry();
      const r = await run(["ft", "self-test-ft"]);
      const after = getRegistry();
      const lines = r.stdout.trim().split("\n");
      const idLine = lines[lines.length - 1];
      const expectedId = `ft-${String(before.ft + 1).padStart(3, "0")}-self-test-ft`;
      assert(
        r.code === 0 &&
        idLine === expectedId &&
        after.ft === before.ft + 1,
        `happy path ft → allocated ID + registry incremented (${before.ft} → ${after.ft})`
      );
    }

    // Test 6: happy path td
    {
      const before = getRegistry();
      const r = await run(["td", "self-test-td"]);
      const after = getRegistry();
      const lines = r.stdout.trim().split("\n");
      const idLine = lines[lines.length - 1];
      const expectedId = `td-${String(before.td + 1).padStart(3, "0")}-self-test-td`;
      assert(
        r.code === 0 &&
        idLine === expectedId &&
        after.td === before.td + 1,
        `happy path td → allocated ID + registry incremented (${before.td} → ${after.td})`
      );
    }

    // Test 7: happy path bg
    {
      const before = getRegistry();
      const r = await run(["bg", "self-test-bg"]);
      const after = getRegistry();
      const lines = r.stdout.trim().split("\n");
      const idLine = lines[lines.length - 1];
      const expectedId = `bg-${String(before.bg + 1).padStart(3, "0")}-self-test-bg`;
      assert(
        r.code === 0 &&
        idLine === expectedId &&
        after.bg === before.bg + 1,
        `happy path bg → allocated ID + registry incremented (${before.bg} → ${after.bg})`
      );
    }

    // Test 8: slug kebab-case with numbers
    {
      const r = await run(["ft", "api-v2-support"]);
      assert(r.code === 0 && r.stdout.includes("api-v2-support"), "kebab-case with numbers → accepted");
    }

    // Test 9: slug single word
    {
      const r = await run(["ft", "simple-record"]);
      assert(r.code === 0, "single-word slug → accepted");
    }

  } finally {
    // Restore registry
    fs.writeFileSync(REGISTRY, registryBackup, "utf-8");
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

function ensureRegistryTable() {
  const content = fs.readFileSync(REGISTRY, "utf-8");
  if (!content.includes("## ID 注册表")) {
    const marker = "| 日期 | 变更内容 | 操作人 |";
    const insertion = `| 日期 | 变更内容 | 操作人 |
|------|----------|--------|

---

## ID 注册表

| 前缀 | 类型 | 当前最大序号 |
|------|------|-------------|
| \`ft\` | Feature | 0 |
| \`td\` | Tech Debt | 0 |
| \`bg\` | Bug | 0 |`;
    fs.writeFileSync(REGISTRY, content.replace(marker, insertion), "utf-8");
  }
}

main();