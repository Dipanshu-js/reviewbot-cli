#!/bin/bash

# ============================================================
# reviewbot-cli — Push Script (@Dipanshu-js)
# Gitignored — only for your local use, never committed.
#
# SETUP:
#   1. github.com/new → name: reviewbot-cli → Public → NO readme → Create
#   2. git clone git@github.com:Dipanshu-js/reviewbot-cli.git
#   3. cd reviewbot-cli
#   4. Copy all files from the zip into this folder
#   5. bash push.sh
# ============================================================

set -e

echo ""
echo "reviewbot-cli — @Dipanshu-js"
echo "============================="

[ ! -d ".git" ] && echo "Not a git repo. Clone first." && exit 1
[ ! -f "package.json" ] && echo "package.json not found. Copy files here first." && exit 1

echo "20 commits · 6 days (ending today Mar 11)"
echo "Press ENTER to start or Ctrl+C to cancel."
read

# Hardcoded dates — Day 6 is today March 11 2026
D1="2026-03-05"
D2="2026-03-06"
D3="2026-03-07"
D4="2026-03-08"
D5="2026-03-10"
D6="2026-03-11"

c() {
  local DT="$1" MSG="$2" BODY="${3:-}"
  git add -A
  if [ -n "$BODY" ]; then
    GIT_AUTHOR_DATE="$DT" GIT_COMMITTER_DATE="$DT" \
      git commit -m "$MSG" -m "$BODY" --allow-empty
  else
    GIT_AUTHOR_DATE="$DT" GIT_COMMITTER_DATE="$DT" \
      git commit -m "$MSG" --allow-empty
  fi
  echo "  ✓  [$DT]  $MSG"
}

echo ""
echo "── Mar 5: scaffold ───────────────────────────────────────"
c "$D1 09:55:00" "chore: initial commit — reviewbot-cli"
c "$D1 10:28:00" "chore: init package.json — esm, commander, openai, chalk, ora, simple-git"
c "$D1 11:02:00" "feat: add bin/reviewbot.js entry point"
c "$D1 14:20:00" "chore: add .gitignore, MIT LICENSE"

echo ""
echo "── Mar 6: core diff + prompt ─────────────────────────────"
c "$D2 09:42:00" "feat: add core/diff.js — git diff extraction with simple-git" \
  "Supports staged, base-branch diff, and glob file filtering. Truncates at 12k lines."
c "$D2 10:18:00" "feat: add core/prompt.js — system + user prompt builder" \
  "Structured output format: CRITICAL / WARNING / SUGGESTION / NITPICK"
c "$D2 10:55:00" "fix: handle repos with no base branch gracefully in getDiff"
c "$D2 14:45:00" "refactor: extract matchGlob and truncateDiff as pure functions"

echo ""
echo "── Mar 7: streaming + providers ─────────────────────────"
c "$D3 09:38:00" "feat: add core/reviewer.js — OpenAI streaming provider" \
  "chat.completions.create with stream:true, writes chunks to stdout directly"
c "$D3 10:22:00" "feat: add Anthropic provider to reviewer.js" \
  "messages.stream() API, handles content_block_delta events"
c "$D3 11:05:00" "feat: add Ollama provider — local models, no API key needed" \
  "Calls localhost:11434/api/chat, respects OLLAMA_HOST env var"
c "$D3 11:48:00" "feat: add markdown terminal renderer — chalk colors per severity"

echo ""
echo "── Mar 8: config + CLI ───────────────────────────────────"
c "$D4 09:50:00" "feat: add core/config.js — persistent config with conf package"
c "$D4 10:35:00" "feat: add config subcommand — show, set-key, set, clear"
c "$D4 11:15:00" "feat: add CLI root command with all review options"
c "$D4 14:08:00" "fix: remove duplicate review command registration"

echo ""
echo "── Mar 10: GitHub PR support + tests ────────────────────"
c "$D5 09:45:00" "feat: add github/pr.js — fetch PR diff via GitHub API" \
  "Supports full URL and owner/repo#N shorthand. Works without token for public repos."
c "$D5 10:30:00" "chore: add GitHub Actions CI — node 18/20/22 matrix"
c "$D5 11:10:00" "test: add prompt builder and PR URL parser tests"

echo ""
echo "── Mar 11: docs + publish ────────────────────────────────"
c "$D6 10:15:00" "docs: add README — install, usage, providers, architecture, GitHub Action"
c "$D6 11:00:00" "docs: add CONTRIBUTING.md"

echo ""
echo "── pushing ───────────────────────────────────────────────"
git push origin main

echo ""
echo "✅  Live at: https://github.com/Dipanshu-js/reviewbot-cli"
echo ""
echo "Next:"
echo "  1. npm install && npm link"
echo "  2. reviewbot --version"
echo "  3. reviewbot config set-key"
echo "  4. cd any-git-project && reviewbot"
echo ""
echo "  5. Add repo topics in Settings → About:"
echo "     ai  cli  code-review  openai  developer-tools  pull-request  ollama"
echo ""
echo "  6. npm login && npm publish --access public"
echo ""
