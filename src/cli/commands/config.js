import chalk from 'chalk';
import inquirer from 'inquirer';
import { getConfig, setConfig, clearConfig, configPath } from '../../core/config.js';

export async function showConfig() {
  const config = await getConfig();
  console.log('\n' + chalk.bold('Current config:'));
  console.log(chalk.dim(configPath()) + '\n');
  console.log(chalk.dim('provider ') + chalk.white(config.provider || 'openai'));
  console.log(chalk.dim('model    ') + chalk.white(config.model || '(default)'));
  console.log(chalk.dim('api_key  ') + (config.apiKey ? chalk.green('***set***') : chalk.red('not set')));
  console.log('');
}

export async function setKey(opts) {
  const provider = opts.provider || 'openai';
  const { apiKey } = await inquirer.prompt([{
    type: 'password',
    name: 'apiKey',
    message: `Enter your ${provider} API key:`,
    mask: '*',
    validate: (v) => v.length > 10 || 'Key looks too short',
  }]);
  await setConfig({ apiKey, provider });
  console.log(chalk.green('\nSaved.') + chalk.dim(' Run: reviewbot\n'));
}

export async function setValue(key, value) {
  const allowed = ['provider', 'model'];
  if (!allowed.includes(key)) {
    console.error(chalk.red(`Unknown key "${key}". Allowed: ${allowed.join(', ')}`));
    process.exit(1);
  }
  await setConfig({ [key]: value });
  console.log(chalk.green(`Set ${key} = ${value}`));
}

export async function clearAll() {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm', message: 'Clear all config?', default: false,
  }]);
  if (confirm) {
    await clearConfig();
    console.log(chalk.yellow('Config cleared.'));
  }
}
