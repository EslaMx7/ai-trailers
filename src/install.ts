import { join, dirname } from "node:path";
import { mkdir, chmod } from "node:fs/promises";
import { type AiTool } from "./tools";

const AI_TRAILERS_MARKER = "ai-trailers";

/**
 * Check if our hook is already installed in a tool's settings file.
 */
async function isInstalled(settingsPath: string): Promise<boolean> {
  const file = Bun.file(settingsPath);
  if (!(await file.exists())) return false;
  const content = await file.text();
  return content.includes(AI_TRAILERS_MARKER);
}

/**
 * Deep merge two objects. Arrays are concatenated.
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (Array.isArray(source[key]) && Array.isArray(result[key])) {
      result[key] = [...result[key], ...source[key]];
    } else if (
      source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) &&
      result[key] && typeof result[key] === "object" && !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Install hook settings for a single tool.
 * Returns true if installed, false if already installed.
 */
export async function installTool(tool: AiTool, cwd: string = process.cwd()): Promise<boolean> {
  const settingsPath = join(cwd, tool.hook.settingsPath);

  if (await isInstalled(settingsPath)) {
    return false;
  }

  // Read existing settings or start fresh
  const file = Bun.file(settingsPath);
  let existing: Record<string, any> = {};
  if (await file.exists()) {
    try {
      existing = JSON.parse(await file.text());
    } catch {
      existing = {};
    }
  }

  // Merge our hook config into existing settings
  const hookConfig = tool.hook.generateConfig();
  const merged = deepMerge(existing, hookConfig);

  // Ensure directory exists
  await mkdir(dirname(settingsPath), { recursive: true });

  await Bun.write(settingsPath, JSON.stringify(merged, null, 2) + "\n");
  return true;
}

const COMMIT_MSG_HOOK = `#!/bin/sh
# ai-trailers: append captured prompts as git trailers
TRAILERS_FILE=".ai-trailers"

if [ ! -f "$TRAILERS_FILE" ] || [ ! -s "$TRAILERS_FILE" ]; then
  exit 0
fi

# Ensure a blank line before trailers
echo "" >> "$1"

cat "$TRAILERS_FILE" >> "$1"

# Clear the file for next commit
: > "$TRAILERS_FILE"
`;

/**
 * Install the commit-msg git hook.
 * If an existing commit-msg hook exists, appends our logic.
 * Returns true if installed, false if already installed.
 */
export async function installGitHook(cwd: string = process.cwd()): Promise<boolean> {
  // Resolve git hooks directory (respects core.hooksPath)
  let hooksDir: string;
  try {
    const proc = Bun.spawnSync(["git", "config", "--get", "core.hooksPath"], { cwd });
    const customPath = proc.stdout.toString().trim();
    hooksDir = customPath || join(cwd, ".git", "hooks");
  } catch {
    hooksDir = join(cwd, ".git", "hooks");
  }

  const hookPath = join(hooksDir, "commit-msg");
  const file = Bun.file(hookPath);

  if (await file.exists()) {
    const content = await file.text();
    if (content.includes(AI_TRAILERS_MARKER)) {
      return false;
    }
    // Append our logic to existing hook
    await Bun.write(hookPath, content + "\n" + COMMIT_MSG_HOOK);
  } else {
    await mkdir(hooksDir, { recursive: true });
    await Bun.write(hookPath, COMMIT_MSG_HOOK);
  }

  await chmod(hookPath, 0o755);
  return true;
}

/**
 * Ensure .ai-trailers is in .gitignore.
 * Returns true if added, false if already present.
 */
export async function ensureGitignore(cwd: string = process.cwd()): Promise<boolean> {
  const gitignorePath = join(cwd, ".gitignore");
  const file = Bun.file(gitignorePath);

  let content = "";
  if (await file.exists()) {
    content = await file.text();
    if (content.includes(".ai-trailers")) {
      return false;
    }
  }

  const newline = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  await Bun.write(gitignorePath, content + newline + ".ai-trailers\n");
  return true;
}
