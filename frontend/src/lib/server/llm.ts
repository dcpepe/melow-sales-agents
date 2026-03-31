import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
const FAST_MODEL = "claude-haiku-4-5-20251001";

/**
 * Extract JSON from LLM response text. Handles:
 * - Markdown code fences
 * - Text before/after JSON
 * - Truncated JSON (attempts repair by closing open brackets)
 */
function extractJSON(raw: string): Record<string, unknown> {
  let text = raw.trim();

  // Strip markdown code fences
  if (text.startsWith("```")) {
    const lines = text.split("\n");
    lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    text = lines.join("\n").trim();
  }

  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // noop — try extraction
  }

  // Find the first { or [
  const startObj = text.indexOf("{");
  const startArr = text.indexOf("[");
  let start = -1;

  if (startObj === -1 && startArr === -1) throw new Error("No JSON found in response");
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);

  // Track ALL bracket types together
  const stack: string[] = [];
  let end = -1;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}") {
      if (stack.length > 0 && stack[stack.length - 1] === "{") {
        stack.pop();
        if (stack.length === 0) { end = i; break; }
      }
    } else if (ch === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === "[") {
        stack.pop();
        if (stack.length === 0) { end = i; break; }
      }
    }
  }

  // If we found matching brackets, parse normally
  if (end !== -1) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // Fall through to repair
    }
  }

  // JSON is truncated — attempt repair by closing open brackets
  let truncated = text.slice(start);

  // If we're inside a string, close it
  const quoteCount = (truncated.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    truncated += '"';
  }

  // Remove any trailing comma or colon
  truncated = truncated.replace(/[,:\s]+$/, "");

  // Close all open brackets in reverse order
  const repairStack: string[] = [];
  let repairInString = false;
  let repairEscape = false;
  for (let i = 0; i < truncated.length; i++) {
    const ch = truncated[i];
    if (repairEscape) { repairEscape = false; continue; }
    if (ch === "\\") { repairEscape = true; continue; }
    if (ch === '"') { repairInString = !repairInString; continue; }
    if (repairInString) continue;
    if (ch === "{") repairStack.push("}");
    else if (ch === "[") repairStack.push("]");
    else if (ch === "}" || ch === "]") repairStack.pop();
  }

  // Close remaining open brackets
  while (repairStack.length > 0) {
    truncated += repairStack.pop();
  }

  try {
    return JSON.parse(truncated);
  } catch (e) {
    // Last resort: try to find any valid JSON substring
    throw new Error(`Could not parse JSON from response (${(e as Error).message}). First 200 chars: ${raw.slice(0, 200)}`);
  }
}

export async function callClaude(prompt: string, fast = false): Promise<Record<string, unknown>> {
  const message = await client.messages.create({
    model: fast ? FAST_MODEL : MODEL,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");

  return extractJSON(block.text);
}

export async function callClaudeText(prompt: string, fast = false): Promise<string> {
  const message = await client.messages.create({
    model: fast ? FAST_MODEL : MODEL,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}
