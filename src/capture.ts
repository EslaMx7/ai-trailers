import { join } from "node:path";
import { getToolByName } from "./tools";

const TRAILERS_FILE = ".ai-trailers";

function parseToolArg(): string {
  const idx = Bun.argv.indexOf("--tool");
  if (idx === -1 || !Bun.argv[idx + 1]) {
    console.error("Usage: ai-trailers capture --tool <tool-name>");
    process.exit(1);
  }
  return Bun.argv[idx + 1];
}

export async function capture() {
  const toolName = parseToolArg();

  const tool = getToolByName(toolName);
  if (!tool) {
    console.error(`Unknown tool: ${toolName}`);
    process.exit(1);
  }

  const prompt = await tool.extractPrompt();
  if (!prompt) {
    process.exit(0);
  }

  const lines: string[] = [`AI-Tool: ${toolName}`];

  if (process.env.AI_TRAILERS_TIMESTAMP === "1") {
    lines.push(`AI-Timestamp: ${new Date().toISOString()}`);
  }

  // Indent continuation lines with a space for multiline prompts
  const formattedPrompt = prompt.replace(/\n/g, "\n ");
  lines.push(`AI-Prompt: ${formattedPrompt}`);

  const entry = lines.join("\n") + "\n";

  const filePath = join(process.cwd(), TRAILERS_FILE);
  const file = Bun.file(filePath);
  const existing = (await file.exists()) ? await file.text() : "";

  await Bun.write(filePath, existing + entry);
}
