<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,100:238636&height=140&section=header&text=reviewbot-cli&fontSize=38&fontColor=ffffff&fontAlignY=50&desc=AI+code+review+streamed+into+your+terminal&descSize=14&descAlignY=70&descFontColor=8b949e" />

![npm](https://img.shields.io/npm/v/reviewbot-cli?style=flat-square&color=238636&labelColor=0d1117)
&nbsp;
![ci](https://img.shields.io/github/actions/workflow/status/Dipanshu-js/reviewbot-cli/ci.yml?style=flat-square&color=238636&labelColor=0d1117&label=ci)
&nbsp;
![node](https://img.shields.io/badge/node-%3E%3D18-238636?style=flat-square&labelColor=0d1117)
&nbsp;
![license](https://img.shields.io/github/license/Dipanshu-js/reviewbot-cli?style=flat-square&color=8b949e&labelColor=0d1117)
&nbsp;
![stars](https://img.shields.io/github/stars/Dipanshu-js/reviewbot-cli?style=flat-square&color=f0b429&labelColor=0d1117)

</div>

---

Run `reviewbot` before `git push`. Get a streaming AI review of your diff in the terminal — bugs, warnings, suggestions — before your teammates see it.

```sh
$ reviewbot

────────────────────────────────────────────────────
 reviewbot · openai · gpt-4o
────────────────────────────────────────────────────

## Summary
Adds user authentication middleware and updates route handlers.

### CRITICAL
**src/middleware/auth.js:14** — JWT secret falls back to a hardcoded string
when `process.env.JWT_SECRET` is undefined. This will silently pass in
production if the env var is missing.

  // current
  const secret = process.env.JWT_SECRET || 'supersecret';

  // fix
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  const secret = process.env.JWT_SECRET;

### WARNING
**src/routes/user.js:38** — No error handling on the `await db.findUser()`
call. An unhandled rejection here will crash the process.

### SUGGESTION
**src/middleware/auth.js:22** — `req.user = decoded` mutates the request
object without a type definition. Consider a typed wrapper or JSDoc.

## What's good
Error responses use consistent status codes throughout.

────────────────────────────────────────────────────
```

---

## Install

```sh
npm install -g reviewbot-cli
```

Or use without installing:

```sh
npx reviewbot-cli
```

---

## Usage

```sh
# Review current unstaged + staged diff vs main
reviewbot

# Review only staged changes
reviewbot --staged

# Review diff against a specific branch
reviewbot --base develop

# Review only certain files
reviewbot --files "src/**/*.ts"

# Review a GitHub pull request by URL
reviewbot --pr https://github.com/owner/repo/pull/42

# Use a different provider
reviewbot --provider anthropic
reviewbot --provider ollama --model llama3
```

---

## Setup

**OpenAI (default)**

```sh
reviewbot config set-key
# paste your key when prompted
```

Or set the environment variable:

```sh
export OPENAI_API_KEY=sk-...
```

**Anthropic**

```sh
reviewbot config set-key --provider anthropic
# or
export ANTHROPIC_API_KEY=sk-ant-...
reviewbot --provider anthropic
```

**Ollama (local, no API key needed)**

```sh
# install ollama: https://ollama.com
ollama pull llama3
reviewbot --provider ollama
```

---

## Config

```sh
reviewbot config show          # show current config
reviewbot config set provider openai
reviewbot config set model gpt-4-turbo
reviewbot config clear
```

Config is stored at:
- macOS: `~/Library/Preferences/reviewbot-cli-nodejs/`
- Linux: `~/.config/reviewbot-cli-nodejs/`
- Windows: `%APPDATA%\reviewbot-cli-nodejs\`

---

## GitHub Action

Add reviewbot as an automated PR check:

```yaml
# .github/workflows/reviewbot.yml
name: AI Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - run: npx reviewbot-cli --base ${{ github.base_ref }} --no-stream
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## Providers

| Provider | Models | Key required |
|---|---|---|
| `openai` | gpt-4o, gpt-4-turbo, gpt-3.5-turbo | Yes — [platform.openai.com](https://platform.openai.com) |
| `anthropic` | claude-3-5-haiku, claude-3-5-sonnet | Yes — [console.anthropic.com](https://console.anthropic.com) |
| `ollama` | llama3, mistral, codellama, any local | No — runs locally |

---

## How it works

```
git diff (or PR diff via GitHub API)
    │
    ▼
diff parser + truncation (fits in context window)
    │
    ▼
prompt builder (system: senior engineer persona + structured output format)
    │
    ▼
AI provider (OpenAI / Anthropic / Ollama) — streaming
    │
    ▼
markdown renderer (CRITICAL in red, WARNING in yellow, terminal-friendly)
```

---

## Contributing

Issues and PRs are welcome. Before opening a PR:

```sh
npm test     # must pass
npm run lint # must pass
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT © [Dipanshu Singh](https://github.com/Dipanshu-js)

<div align="center">
<br/>
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:238636,100:0d1117&height=80&section=footer" />
</div>
