export type ToolHookConfig = {
  /** Hook event name used by the tool */
  hookEvent: string;
  /** Path to the tool's settings file (relative to project root) */
  settingsPath: string;
  /** Generate the hook configuration JSON to add to the tool's settings */
  generateConfig: () => Record<string, unknown>;
};

export type AiTool = {
  name: string;
  markers: string[];
  hook: ToolHookConfig;
};

const tools: AiTool[] = [
  {
    name: "Claude Code",
    markers: ["CLAUDE.md", ".claude"],
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
    hook: {
      hookEvent: "userPromptSubmit",
      settingsPath: ".kiro/settings.json",
      generateConfig: () => ({
        hooks: {
          userPromptSubmit: [
            {
              command: `bunx ai-trailers capture --tool "Kiro"`,
            },
          ],
        },
      }),
    },
  },
  {
    name: "Gemini",
    markers: [".gemini"],
    hook: {
      hookEvent: "BeforeAgent",
      settingsPath: ".gemini/settings.json",
      generateConfig: () => ({
        hooks: {
          BeforeAgent: [
            {
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
];

export function getTools(): AiTool[] {
  return tools;
}

export function getToolByName(name: string): AiTool | undefined {
  return tools.find((t) => t.name === name);
}
