#!/usr/bin/env bun

import { isGitRepo, detectTools } from "./detect";
import { capture } from "./capture";
import { installTool, installGitHook, ensureGitignore } from "./install";
import { getToolByName } from "./tools";

const command = Bun.argv[2];

switch (command) {
  case "init":
    await init();
    break;
  case "install":
    await install();
    break;
  case "capture":
    await capture();
    break;
  default:
    usage();
}

async function init() {
  if (!(await isGitRepo())) {
    console.error("Error: not a git repository. Run `git init` first.");
    process.exit(1);
  }

  console.log("Initializing ai-trailers...\n");

  const tools = await detectTools();

  if (tools.length === 0) {
    console.log("No AI coding tools detected.");
    return;
  }

  console.log("Detected AI coding tools:");
  for (const tool of tools) {
    console.log(`  - ${tool.name} (${tool.foundMarkers.join(", ")})`);
  }

  console.log("\nInstalling hooks...");
  for (const tool of tools) {
    const installed = await installTool(tool);
    if (installed) {
      console.log(`  + ${tool.name} hook installed (${tool.hook.settingsPath})`);
    } else {
      console.log(`  ~ ${tool.name} hook already installed, skipping`);
    }
  }

  // Install commit-msg git hook
  console.log("\nInstalling git commit-msg hook...");
  const hookInstalled = await installGitHook();
  if (hookInstalled) {
    console.log("  + commit-msg hook installed");
  } else {
    console.log("  ~ commit-msg hook already installed, skipping");
  }

  // Ensure .ai-trailers is gitignored
  const ignored = await ensureGitignore();
  if (ignored) {
    console.log("  + .ai-trailers added to .gitignore");
  } else {
    console.log("  ~ .ai-trailers already in .gitignore");
  }

  console.log("\nDone!");
}

async function install() {
  if (!(await isGitRepo())) {
    console.error("Error: not a git repository. Run `git init` first.");
    process.exit(1);
  }

  const toolName = Bun.argv[3];
  if (!toolName) {
    console.error("Usage: ai-trailers install <tool-name>");
    console.error("Available tools: Claude Code, Kiro, Gemini");
    process.exit(1);
  }

  const tool = getToolByName(toolName);
  if (!tool) {
    console.error(`Unknown tool: ${toolName}`);
    console.error("Available tools: Claude Code, Kiro, Gemini");
    process.exit(1);
  }

  const installed = await installTool(tool);
  if (installed) {
    console.log(`Installed ${tool.name} hook (${tool.hook.settingsPath})`);
  } else {
    console.log(`${tool.name} hook already installed, skipping`);
  }
}

function usage() {
  console.log(`ai-trailers - Capture AI coding tool prompts as git trailers in commit messages

Usage: ai-trailers <command>

Commands:
  init               Initialize ai-trailers in the current repo
  install <tool>     Install hook for a specific tool (Claude Code, Kiro, Gemini)
  capture            Capture a prompt from stdin (used by tool hooks)`);
}
