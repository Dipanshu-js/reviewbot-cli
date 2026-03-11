import chalk from "chalk";
import inquirer from "inquirer";
import {
  getConfig,
  setConfig,
  clearConfig,
  configPath,
} from "../../core/config.js";

const PROVIDERS = [
  { name: "OpenAI      (gpt-4o)", value: "openai" },
  { name: "Anthropic   (claude-3-5-haiku)", value: "anthropic" },
  { name: "Grok        (grok-beta)", value: "grok" },
  { name: "Gemini      (gemini-1.5-flash)", value: "gemini" },
  { name: "Ollama      (local, no key needed)", value: "ollama" },
];

export async function showConfig() {
  const config = await getConfig();
  console.log("\n" + chalk.bold("Current config:"));
  console.log(chalk.dim(configPath()) + "\n");
  console.log(
    chalk.dim("provider ") + chalk.white(config.provider || "openai"),
  );
  console.log(
    chalk.dim("model    ") + chalk.white(config.model || "(default)"),
  );
  console.log(
    chalk.dim("api_key  ") +
      (config.apiKey ? chalk.green("***set***") : chalk.red("not set")),
  );
  console.log("");
}

export async function setKey(opts) {
  // Step 1 — confirm they want to set a key
  const { proceed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: "Set up an AI provider API key?",
      default: true,
    },
  ]);

  if (!proceed) {
    console.log(chalk.dim("\nCancelled.\n"));
    return;
  }

  // Step 2 — choose provider
  const { provider } = await inquirer.prompt([
    {
      type: "list",
      name: "provider",
      message: "Which provider?",
      choices: PROVIDERS,
      default: opts.provider || "openai",
    },
  ]);

  // Ollama needs no key
  if (provider === "ollama") {
    await setConfig({ provider });
    console.log(
      chalk.green("\nSaved.") +
        chalk.dim(" Ollama needs no API key — just run: ollama pull llama3\n"),
    );
    return;
  }

  // Step 3 — enter the key
  const keyLabel = keyPlaceholder(provider);
  const { apiKey } = await inquirer.prompt([
    {
      type: "password",
      name: "apiKey",
      message: `Enter your ${provider} API key ${chalk.dim(`(starts with ${keyLabel})`)}:`,
      mask: "*",
      validate: (v) => v.length > 10 || "Key looks too short",
    },
  ]);

  await setConfig({ apiKey, provider });

  console.log(
    "\n" +
      chalk.green("Saved.") +
      chalk.dim(` Provider: ${provider}`) +
      "\n" +
      chalk.dim("Run: reviewbot") +
      "\n",
  );
}

export async function setValue(key, value) {
  const allowed = ["provider", "model"];
  if (!allowed.includes(key)) {
    console.error(
      chalk.red(`Unknown key "${key}". Allowed: ${allowed.join(", ")}`),
    );
    process.exit(1);
  }
  await setConfig({ [key]: value });
  console.log(chalk.green(`Set ${key} = ${value}`));
}

export async function clearAll() {
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Clear all config?",
      default: false,
    },
  ]);
  if (confirm) {
    await clearConfig();
    console.log(chalk.yellow("Config cleared."));
  }
}

function keyPlaceholder(provider) {
  const map = {
    openai: "sk-...",
    anthropic: "sk-ant-...",
    grok: "xai-...",
    gemini: "AIza...",
  };
  return map[provider] || "...";
}
