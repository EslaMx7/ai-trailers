import { exists } from "node:fs/promises";
import { join } from "node:path";

export type DetectedTool = {
  name: string;
  markers: string[];
};

const TOOLS = [
  { name: "Claude Code", markers: ["CLAUDE.md", ".claude"] },
  { name: "Kiro", markers: [".kiro"] },
  { name: "Gemini", markers: [".gemini"] },
];

export async function isGitRepo(cwd: string = process.cwd()): Promise<boolean> {
  return exists(join(cwd, ".git"));
}

export async function detectTools(cwd: string = process.cwd()): Promise<DetectedTool[]> {
  const detected: DetectedTool[] = [];

  for (const tool of TOOLS) {
    const found: string[] = [];
    for (const marker of tool.markers) {
      if (await exists(join(cwd, marker))) {
        found.push(marker);
      }
    }
    if (found.length > 0) {
      detected.push({ name: tool.name, markers: found });
    }
  }

  return detected;
}
