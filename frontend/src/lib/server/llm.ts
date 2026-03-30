import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
const FAST_MODEL = "claude-haiku-4-5-20251001";

function extractJSON(raw: string): Record<string, unknown> {
  // Strip markdown code fences
  let text = raw.trim();
  if (text.startsWith("```")) {
    const lines = text.split("\n");
    lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    text = lines.join("\n");
  }

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Find the outermost JSON object or array
    const startObj = text.indexOf("{");
    const startArr = text.indexOf("[");
    let start = -1;

    if (startObj === -1 && startArr === -1) throw new Error("No JSON found in response");
    if (startObj === -1) start = startArr;
    else if (startArr === -1) start = startObj;
    else start = Math.min(startObj, startArr);

    const isArray = text[start] === "[";
    const closeChar = isArray ? "]" : "}";
    const openChar = isArray ? "[" : "{";

    // Find matching closing bracket
    let depth = 0;
    let end = -1;
    let inString = false;
    let escape = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === openChar) depth++;
      if (ch === closeChar) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }

    if (end === -1) throw new Error("Unterminated JSON in response");
    return JSON.parse(text.slice(start, end + 1));
  }
}

export async function callClaude(prompt: string, fast = false): Promise<Record<string, unknown>> {
  const message = await client.messages.create({
    model: fast ? FAST_MODEL : MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");

  return extractJSON(block.text);
}

export async function callClaudeText(prompt: string, fast = false): Promise<string> {
  const message = await client.messages.create({
    model: fast ? FAST_MODEL : MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}
