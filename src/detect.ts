import { exists } from "node:fs/promises";
import { join } from "node:path";
import { getTools, type AiTool } from "./tools";

export type DetectedTool = AiTool & {
  foundMarkers: string[];
};

export async function isGitRepo(cwd: string = process.cwd()): Promise<boolean> {
  return exists(join(cwd, ".git"));
}

export async function detectTools(cwd: string = process.cwd()): Promise<DetectedTool[]> {
  const detected: DetectedTool[] = [];

  for (const tool of getTools()) {
    const foundMarkers: string[] = [];
    for (const marker of tool.markers) {
      if (await exists(join(cwd, marker))) {
        foundMarkers.push(marker);
      }
    }
    if (foundMarkers.length > 0) {
      detected.push({ ...tool, foundMarkers });
    }
  }

  return detected;
}
