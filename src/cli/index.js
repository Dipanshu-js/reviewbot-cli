import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

export const program = new Command();

// Root command — runs a review by default
program
  .name('reviewbot')
  .description('AI code review streamed into your terminal')
  .version(pkg.version)
  .option('-p, --provider <n>', 'AI provider: openai | anthropic | ollama', 'openai')
  .option('-m, --model <n>', 'Model name override')
  .option('-f, --files <glob>', 'Only review files matching glob pattern')
  .option('-b, --base <branch>', 'Base branch to diff against', 'main')
  .option('--staged', 'Review only staged changes')
  .option('--no-stream', 'Disable streaming, wait for full response')
  .option('--pr <url>', 'Review a GitHub PR by URL')
  .action(async (opts) => {
    const { runReview } = await import('./commands/review.js');
    await runReview(opts);
  });

// Config subcommand
const configCmd = new Command('config').description('Manage reviewbot configuration');

configCmd
  .command('show')
  .description('Show current config')
  .action(async () => {
    const { showConfig } = await import('./commands/config.js');
    await showConfig();
  });

configCmd
  .command('set-key')
  .description('Set your AI provider API key')
  .option('-p, --provider <n>', 'Provider: openai | anthropic', 'openai')
  .action(async (opts) => {
    const { setKey } = await import('./commands/config.js');
    await setKey(opts);
  });

configCmd
  .command('set <key> <value>')
  .description('Set a config value: provider | model')
  .action(async (key, value) => {
    const { setValue } = await import('./commands/config.js');
    await setValue(key, value);
  });

configCmd
  .command('clear')
  .description('Clear all saved config')
  .action(async () => {
    const { clearAll } = await import('./commands/config.js');
    await clearAll();
  });

program.addCommand(configCmd);
