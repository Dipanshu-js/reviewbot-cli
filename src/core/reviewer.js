import chalk from "chalk";

export async function streamReview(
  prompt,
  { provider, model, stream = true, config },
) {
  switch (provider) {
    case "openai":
      return streamOpenAI(prompt, { model, stream, config });
    case "anthropic":
      return streamAnthropic(prompt, { model, stream, config });
    case "grok":
      return streamGrok(prompt, { model, stream, config });
    case "gemini":
      return streamGemini(prompt, { model, stream, config });
    case "ollama":
      return streamOllama(prompt, { model, stream });
    default:
      throw new Error(
        `Unknown provider "${provider}". Use: openai | anthropic | grok | gemini | ollama`,
      );
  }
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

async function streamOpenAI(prompt, { model = "gpt-4o", stream, config }) {
  const { default: OpenAI } = await import("openai");
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey)
    throw new Error("API key not found. Run: reviewbot config set-key");

  const client = new OpenAI({ apiKey });
  const messages = [
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ];

  if (stream) {
    const res = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature: 0.2,
    });
    for await (const chunk of res) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) process.stdout.write(render(text));
    }
  } else {
    const res = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
    });
    process.stdout.write(render(res.choices[0].message.content ?? ""));
  }

  console.log("\n" + chalk.dim("─".repeat(60)) + "\n");
}

// ── Anthropic ─────────────────────────────────────────────────────────────────

async function streamAnthropic(
  prompt,
  { model = "claude-3-5-haiku-20241022", stream, config },
) {
  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch {
    throw new Error(
      "@anthropic-ai/sdk not installed. Run: npm install @anthropic-ai/sdk",
    );
  }

  const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    throw new Error("API key not found. Run: reviewbot config set-key");

  const client = new Anthropic({ apiKey });

  if (stream) {
    const res = client.messages.stream({
      model,
      max_tokens: 2048,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });
    for await (const event of res) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        process.stdout.write(render(event.delta.text));
      }
    }
  } else {
    const res = await client.messages.create({
      model,
      max_tokens: 2048,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });
    process.stdout.write(render(res.content[0].text ?? ""));
  }

  console.log("\n" + chalk.dim("─".repeat(60)) + "\n");
}

// ── Grok (xAI) — OpenAI-compatible API ───────────────────────────────────────

async function streamGrok(prompt, { model = "grok-beta", stream, config }) {
  const { default: OpenAI } = await import("openai");
  const apiKey =
    config?.apiKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey)
    throw new Error("Grok API key not found. Run: reviewbot config set-key");

  // Grok uses OpenAI-compatible API at a different base URL
  const client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
  const messages = [
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ];

  if (stream) {
    const res = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature: 0.2,
    });
    for await (const chunk of res) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) process.stdout.write(render(text));
    }
  } else {
    const res = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
    });
    process.stdout.write(render(res.choices[0].message.content ?? ""));
  }

  console.log("\n" + chalk.dim("─".repeat(60)) + "\n");
}

// ── Gemini (Google) ───────────────────────────────────────────────────────────

async function streamGemini(
  prompt,
  { model = "gemini-1.5-flash", stream, config },
) {
  const apiKey =
    config?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey)
    throw new Error("Gemini API key not found. Run: reviewbot config set-key");

  const fullText = `${prompt.system}\n\n${prompt.user}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? "streamGenerateContent" : "generateContent"}?key=${apiKey}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: fullText }] }],
    generationConfig: { temperature: 0.2 },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  if (stream) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Gemini streams as a JSON array — parse completed chunks
      const chunks = buffer.split("\n").filter(Boolean);
      for (const line of chunks) {
        try {
          const json = JSON.parse(
            line.replace(/^data:\s*/, "").replace(/,$/, ""),
          );
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) process.stdout.write(render(text));
          buffer = "";
        } catch {
          // incomplete chunk — keep buffering
        }
      }
    }
  } else {
    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    process.stdout.write(render(text));
  }

  console.log("\n" + chalk.dim("─".repeat(60)) + "\n");
}

// ── Ollama (local) ────────────────────────────────────────────────────────────

async function streamOllama(prompt, { model = "llama3", stream }) {
  const baseUrl = process.env.OLLAMA_HOST || "http://localhost:11434";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      stream,
      options: { temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama error ${response.status}: ${await response.text()}`,
    );
  }

  if (stream) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder
        .decode(value, { stream: true })
        .split("\n")
        .filter(Boolean)) {
        try {
          const text = JSON.parse(line).message?.content ?? "";
          if (text) process.stdout.write(render(text));
        } catch {
          /* skip malformed */
        }
      }
    }
  } else {
    const json = await response.json();
    process.stdout.write(render(json.message?.content ?? ""));
  }

  console.log("\n" + chalk.dim("─".repeat(60)) + "\n");
}

// ── Markdown → terminal renderer ──────────────────────────────────────────────

function render(text) {
  return text
    .replace(/^## (.+)$/gm, (_, h) => "\n" + chalk.bold.white(h) + "\n")
    .replace(/^### CRITICAL$/gm, chalk.bold.red("### CRITICAL"))
    .replace(/^### WARNING$/gm, chalk.bold.yellow("### WARNING"))
    .replace(/^### SUGGESTION$/gm, chalk.bold.cyan("### SUGGESTION"))
    .replace(/^### NITPICK$/gm, chalk.dim("### NITPICK"))
    .replace(/^### (.+)$/gm, (_, h) => chalk.bold.blue("### " + h))
    .replace(/`([^`\n]+)`/g, (_, c) =>
      chalk.bgHex("#1e1e1e").hex("#e06c75")(` ${c} `),
    )
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t));
}
