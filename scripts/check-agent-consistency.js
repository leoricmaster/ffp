#!/usr/bin/env node
/**
 * Agent-Skill Consistency Check (L1 enforcement)
 *
 * Scans agent prompts and skills for cross-reference integrity.
 * Ensures paths, schemas, and contracts referenced in prompts exist
 * and are consistent across the configuration surface.
 *
 * Usage:
 *   node scripts/check-agent-consistency.js
 *
 * Exit codes:
 *   0 - all checks passed
 *   1 - consistency violations found
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const AGENTS_DIR = path.join(REPO_ROOT, ".claude", "agents", "prompts");
const SKILLS_DIR = path.join(REPO_ROOT, ".claude", "skills");

// Resolve project memory directory: ~/.claude/projects/<sanitized-repo-path>/memory
const PROJECT_MEMORY_DIR = (() => {
  const sanitized = REPO_ROOT.replace(/\//g, "-");
  return path.join(os.homedir(), ".claude", "projects", sanitized, "memory");
})();

const errors = [];
const warnings = [];

function logError(msg) {
  errors.push(msg);
  console.error(`[CONSISTENCY] ERROR: ${msg}`);
}

function logWarning(msg) {
  warnings.push(msg);
  console.warn(`[CONSISTENCY] WARN: ${msg}`);
}

// ---------------------------------------------------------------------------
// 1. Check that skill references in agent prompts point to existing files
// ---------------------------------------------------------------------------
function checkAgentSkillRefs() {
  const agents = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".md"));
  const skillRefRegex = /\.claude\/skills\/([^/\s)]+)\/SKILL\.md/g;

  for (const agentFile of agents) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, agentFile), "utf-8");
    let match;
    while ((match = skillRefRegex.exec(content)) !== null) {
      const skillName = match[1];
      const skillPath = path.join(SKILLS_DIR, skillName, "SKILL.md");
      if (!fs.existsSync(skillPath)) {
        logError(`${agentFile} references missing skill: .claude/skills/${skillName}/SKILL.md`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Check that agent references in skills point to existing files
// ---------------------------------------------------------------------------
function checkSkillAgentRefs() {
  const skills = fs
    .readdirSync(SKILLS_DIR)
    .filter((d) => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory());
  const agentRefRegex = /agents\/prompts\/([a-z-]+\.md)/g;

  for (const skillName of skills) {
    const skillPath = path.join(SKILLS_DIR, skillName, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const content = fs.readFileSync(skillPath, "utf-8");
    let match;
    while ((match = agentRefRegex.exec(content)) !== null) {
      const agentFile = match[1];
      const agentPath = path.join(AGENTS_DIR, agentFile);
      if (!fs.existsSync(agentPath)) {
        logError(`skills/${skillName}/SKILL.md references missing agent: ${agentFile}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Check .last-action-summary.md frontmatter consistency across agents
// ---------------------------------------------------------------------------
function checkLastActionSummarySchema() {
  const agents = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".md"));
  const schemas = [];

  for (const agentFile of agents) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, agentFile), "utf-8");
    const fmMatch = content.match(/```yaml\n---\n(agent:.*?)\n---\n```/s);
    if (fmMatch) {
      schemas.push({ agent: agentFile, schema: fmMatch[1] });
    }
  }

  if (schemas.length === 0) return;

  // All schemas should have the same field definitions
  const expectedFields = ["agent:", "feature_id:", "status:"];
  for (const { agent, schema } of schemas) {
    for (const field of expectedFields) {
      if (!schema.includes(field)) {
        logError(`${agent} .last-action-summary.md schema missing field: ${field}`);
      }
    }
  }

  // Check status enum consistency
  const statusEnumRegex = /status:.*#\s*(.+)/;
  const statusEnums = schemas.map((s) => {
    const m = s.schema.match(statusEnumRegex);
    return { agent: s.agent, enum: m ? m[1].trim() : null };
  });

  const firstEnum = statusEnums[0].enum;
  for (const { agent, enum: e } of statusEnums) {
    if (e && e !== firstEnum) {
      logWarning(`${agent} has different status enum: "${e}" vs "${firstEnum}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Check state.md schema consistency (feature-level vs us-level)
// ---------------------------------------------------------------------------
function checkStateSchemaConsistency() {
  const orchestratorPath = path.join(AGENTS_DIR, "orchestrator.md");
  const content = fs.readFileSync(orchestratorPath, "utf-8");

  // Extract feature-level schema
  const featureMatch = content.match(/Feature 级 state\.md Schema[\s\S]*?```yaml\n(---[\s\S]*?---)\n```/);
  const usMatch = content.match(/US 级 state\.md Schema[\s\S]*?```yaml\n(---[\s\S]*?---)\n```/);

  if (!featureMatch || !usMatch) {
    logWarning("Could not extract state.md schemas from orchestrator.md");
    return;
  }

  const featureSchema = featureMatch[1];
  const usSchema = usMatch[1];

  // US-level should include all feature-level fields plus us-specific ones
  const featureFields = featureSchema.split("\n").filter((l) => l.includes(":"));
  for (const fieldLine of featureFields) {
    const key = fieldLine.split(":")[0].trim();
    if (key.startsWith("#")) continue;
    if (!usSchema.includes(key)) {
      logWarning(`US-level state.md schema missing feature-level field: ${key}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Check for common path inconsistencies
// ---------------------------------------------------------------------------
function checkPathConsistency() {
  const checks = [
    {
      name: "OpenAPI path",
      correct: "docs/api/openapi.yaml",
      incorrect: "docs/architecture/api/openapi.yaml",
    },
    {
      name: "ADR decisions path",
      correct: "docs/decisions/",
      incorrect: "docs/architecture/decisions/",
    },
  ];

  const allFiles = [
    ...fs.readdirSync(AGENTS_DIR).map((f) => path.join(AGENTS_DIR, f)),
    ...fs
      .readdirSync(SKILLS_DIR)
      .map((d) => path.join(SKILLS_DIR, d, "SKILL.md")),
  ];

  for (const filePath of allFiles) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    const relPath = path.relative(REPO_ROOT, filePath);

    for (const check of checks) {
      if (content.includes(check.incorrect)) {
        logError(`${relPath} uses incorrect path "${check.incorrect}", should be "${check.correct}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Check for dangling memory references in skills
// ---------------------------------------------------------------------------
function checkMemoryRefs() {
  const existingMemories = fs.existsSync(PROJECT_MEMORY_DIR)
    ? fs.readdirSync(PROJECT_MEMORY_DIR).filter((f) => f.endsWith(".md"))
    : [];

  const allSkillFiles = fs
    .readdirSync(SKILLS_DIR)
    .map((d) => path.join(SKILLS_DIR, d, "SKILL.md"))
    .filter((f) => fs.existsSync(f));

  for (const skillPath of allSkillFiles) {
    const content = fs.readFileSync(skillPath, "utf-8");
    const relPath = path.relative(REPO_ROOT, skillPath);
    const memRefs = content.match(/memory\/[a-zA-Z0-9_-]+\.md/g) || [];
    for (const ref of memRefs) {
      const memFile = path.basename(ref);
      if (!existingMemories.includes(memFile)) {
        logWarning(`${relPath} references missing memory file: "${ref}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log("[check-agent-consistency] Scanning agent/skill cross-references...\n");

  checkAgentSkillRefs();
  checkSkillAgentRefs();
  checkLastActionSummarySchema();
  checkStateSchemaConsistency();
  checkPathConsistency();
  checkMemoryRefs();

  console.log("\n---");
  if (errors.length === 0 && warnings.length === 0) {
    console.log("[check-agent-consistency] ALL CHECKS PASSED");
    process.exit(0);
  }

  console.log(`[check-agent-consistency] ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
