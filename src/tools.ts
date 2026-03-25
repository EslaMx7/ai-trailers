import { extractFromStdin, extractFromEnv } from "./extractors";

export type ToolHookConfig = {
  /** Hook event name used by the tool */
  hookEvent: string;
  /** Path to the tool's settings file (relative to project root) */
  settingsPath: string;
  /** Generate the hook configuration JSON to add to the tool's settings */
  generateConfig: () => Record<string, unknown>;
  /** Additional files to create/update during install (e.g. feature flags) */
  extraFiles?: ExtraFile[];
};

export type ExtraFile = {
  path: string;
  content: string;
  /** If true, only create if file doesn't exist. If false, append if marker not present. */
  createOnly?: boolean;
  /** Marker to check before appending (avoids duplicates) */
  marker?: string;
};

export type AiTool = {
  name: string;
  markers: string[];
  hook: ToolHookConfig;
  /** Extract the user prompt from this tool's hook invocation */
  extractPrompt: () => Promise<string | null>;
};

const tools: AiTool[] = [
  {
    name: "Claude Code",
    markers: ["CLAUDE.md", ".claude"],
    extractPrompt: () => extractFromStdin({ format: "json", path: "prompt" }),
    hook: {
      hookEvent: "UserPromptSubmit",
      settingsPath: ".claude/settings.json",
      generateConfig: () => ({
        hooks: {
          UserPromptSubmit: [
            {
              matcher: "",
              hooks: [
                {
                  type: "command",
                  command: `bunx ai-trailers capture --tool "Claude Code"`,
                },
              ],
            },
          ],
        },
      }),
    },
  },
  {
    name: "Kiro",
    markers: [".kiro"],
    extractPrompt: () => extractFromEnv("USER_PROMPT"),
    hook: {
      hookEvent: "promptSubmit",
      settingsPath: ".kiro/hooks/ai-trailers.kiro.hook",
      generateConfig: () => ({
        enabled: true,
        name: "ai-trailers capture",
        description: "Captures user prompts as git trailers in commit messages",
        version: "1",
        when: {
          type: "promptSubmit",
        },
        then: {
          type: "runCommand",
          command: `bunx ai-trailers capture --tool "Kiro"`,
        },
      }),
    },
  },
  {
    name: "Gemini",
    markers: [".gemini"],
    extractPrompt: () => extractFromStdin({ format: "json", path: "prompt" }),
    hook: {
      hookEvent: "BeforeAgent",
      settingsPath: ".gemini/settings.json",
      generateConfig: () => ({
        hooks: {
          BeforeAgent: [
            {
              matcher: "*",
              hooks: [
                {
                  name: "ai-trailers-capture",
                  type: "command",
                  command: `bunx ai-trailers capture --tool "Gemini"`,
                },
              ],
            },
          ],
        },
      }),
    },
  },
  {
    name: "Codex",
    markers: [".codex"],
    extractPrompt: () => extractFromStdin({ format: "json", path: "prompt" }),
    hook: {
      hookEvent: "UserPromptSubmit",
      settingsPath: ".codex/hooks.json",
      generateConfig: () => ({
        hooks: {
          UserPromptSubmit: [
            {
              hooks: [
                {
                  type: "command",
                  command: `bunx ai-trailers capture --tool "Codex"`,
                  timeoutSec: 10,
                },
              ],
            },
          ],
        },
      }),
      extraFiles: [
        {
          path: ".codex/config.toml",
          marker: "codex_hooks",
          content: "\n[features]\ncodex_hooks = true\n",
        },
      ],
    },
  },
];

export function getTools(): AiTool[] {
  return tools;
}

export function getToolByName(name: string): AiTool | undefined {
  return tools.find((t) => t.name === name);
}
