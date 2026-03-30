import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

export async function callClaude(prompt: string): Promise<Record<string, unknown>> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");

  let raw = block.text.trim();
  // Strip markdown code fences if present
  if (raw.startsWith("```")) {
    const lines = raw.split("\n");
    lines.shift(); // remove opening fence
    while (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    raw = lines.join("\n");
  }
  return JSON.parse(raw);
}
