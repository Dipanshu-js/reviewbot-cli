# Contributing

## Setup

```sh
git clone https://github.com/Dipanshu-js/reviewbot-cli
cd reviewbot-cli
npm install
npm test
```

## Before opening a PR

- `npm test` passes
- `npm run lint` passes
- New features include tests
- Commits follow [Conventional Commits](https://www.conventionalcommits.org)

## Adding a new provider

1. Add a `stream<ProviderName>` function in `src/core/reviewer.js`
2. Add the provider name to the switch statement
3. Update the providers table in `README.md`
4. Add a test in `src/core/reviewer.test.js`

## Commit format

```
feat: add anthropic provider
fix: handle empty diff gracefully
docs: add ollama setup instructions
test: add prompt builder tests
chore: bump openai sdk to 4.47
```
