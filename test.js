import { buildPrompt } from "./src/core/prompt.js";
import { getPRDiff } from "./src/github/pr.js";

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    failed++;
  }
}

// ── Test 1: buildPrompt ───────────────────────────────────────────────────────
console.log("\nbuildPrompt");
const { system, user } = buildPrompt(
  'diff --git a/index.js\n+console.log("x")',
  { filesGlob: "**/*.js" },
);
assert(typeof system === "string", "system is a string");
assert(system.includes("CRITICAL"), "system mentions CRITICAL");
assert(system.includes("WARNING"), "system mentions WARNING");
assert(user.includes("**/*.js"), "user includes filesGlob");
assert(user.includes("diff --git"), "user includes diff content");

const { user: u2 } = buildPrompt("diff");
assert(!u2.includes("Only reviewing"), "no filter line when no glob");

// ── Test 2: PR URL parser ─────────────────────────────────────────────────────
console.log("\nparsePRUrl");
try {
  await getPRDiff("not-a-url");
  assert(false, "should have thrown on bad URL");
} catch (e) {
  assert(e.message.includes("Cannot parse"), "throws correct error on bad URL");
}

// ── Test 3: matchGlob logic ───────────────────────────────────────────────────
console.log("\nmatchGlob");
function matchGlob(filePath, glob) {
  const pattern = glob
    .replace(/\./g, "\\.")
    .replace(/\*\*\//g, "(.+/)?")
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${pattern}$`).test(filePath);
}
assert(matchGlob("src/app.ts", "**/*.ts"), "**/*.ts matches src/app.ts");
assert(!matchGlob("src/app.js", "**/*.ts"), "**/*.ts does not match .js");
assert(matchGlob("app.ts", "*.ts"), "*.ts matches root file");
assert(!matchGlob("src/app.ts", "*.ts"), "*.ts does not match nested");
assert(matchGlob("src/core/diff.js", "**/*.js"), "**/*.js matches deep path");

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
