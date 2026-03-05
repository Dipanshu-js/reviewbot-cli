import chalk from 'chalk';
import ora from 'ora';
import { getDiff } from '../../core/diff.js';
import { buildPrompt } from '../../core/prompt.js';
import { streamReview } from '../../core/reviewer.js';
import { getConfig } from '../../core/config.js';

export async function runReview(opts) {
  const config = await getConfig();
  const provider = opts.provider || config.provider || 'openai';
  const model = opts.model || config.model || undefined;

  const spinner = ora({ text: 'Fetching diff...', color: 'cyan' }).start();

  let diff;
  try {
    if (opts.pr) {
      const { getPRDiff } = await import('../../github/pr.js');
      diff = await getPRDiff(opts.pr, config);
    } else {
      diff = await getDiff({
        staged: opts.staged ?? false,
        base: opts.base ?? 'main',
        filesGlob: opts.files,
      });
    }
  } catch (err) {
    spinner.fail(chalk.red(`Failed to get diff: ${err.message}`));
    process.exit(1);
  }

  if (!diff || diff.trim().length === 0) {
    spinner.warn(chalk.yellow('No changes to review.'));
    process.exit(0);
  }

  spinner.succeed(chalk.dim(`Got diff — ${diff.split('\n').length} lines`));

  const prompt = buildPrompt(diff, { filesGlob: opts.files });

  printHeader(provider, model);

  try {
    await streamReview(prompt, { provider, model, stream: opts.stream !== false, config });
  } catch (err) {
    if (err.message?.includes('API key')) {
      console.error(chalk.red('\nNo API key found.') + chalk.dim('\nRun: reviewbot config set-key\n'));
    } else {
      console.error(chalk.red(`\nError: ${err.message}`));
    }
    process.exit(1);
  }
}

function printHeader(provider, model) {
  const label = model || { openai: 'gpt-4o', anthropic: 'claude-3-5-haiku-20241022', ollama: 'llama3' }[provider] || 'unknown';
  console.log('\n' + chalk.dim('─'.repeat(60)));
  console.log(chalk.bold.green(' reviewbot') + chalk.dim(` · ${provider} · ${label}`));
  console.log(chalk.dim('─'.repeat(60)) + '\n');
}
