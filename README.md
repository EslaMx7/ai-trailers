# ai-trailers

Capture AI coding tool prompts as git trailers in commit messages.

> **WARNING:** This tool embeds your AI prompts into git commit messages. These prompts become part of your git history and will be visible to anyone with access to the repository. **Do not include secrets, credentials, personal information, or sensitive data in your prompts.** Review your commit messages before pushing to a shared or public repository. You are solely responsible for the content of your prompts.

## Why?

AI coding tools are transforming how we write software. But when you look at a git history, you only see the code that changed — not the human intent that guided it.

Every prompt you write to an AI tool is a decision. It captures *why* you made a change, *what* you asked for, and *how* you directed the AI. Today, that context is lost the moment your session ends — scattered across different tools, each with its own siloed conversation history. Switch from Claude Code to Kiro to Gemini, and the intent behind your changes is fragmented across tools that don't talk to each other.

This matters most during PR reviews. The diff shows what changed, the PR description is often AI-generated, but the *human steering* — the actual prompts that shaped the code — is nowhere to be found.

**ai-trailers** fixes this by embedding your prompts directly into commit messages as standard git trailers. One central place, regardless of which AI tool you used — making your intent searchable, reviewable, and permanent.

The code tells you *what* changed. The trailers tell you *why*.

## How it works

1. **Capture** — Each AI tool's hook system fires when you submit a prompt. ai-trailers captures it and stores it in a local `.ai-trailers` file.
2. **Append** — When you commit, a `commit-msg` git hook appends the captured prompts to your commit message as standard git trailers.
3. **Clear** — The `.ai-trailers` file is cleared after each commit, ready for the next round.

### In action

| GitHub commits page | VS Code git history |
|:---:|:---:|
| ![AI trailers on GitHub commits page](https://github.com/user-attachments/assets/d4cc2449-b11c-4f85-b13c-8b06678934be) | ![AI trailers in VS Code git history](https://github.com/user-attachments/assets/b7a3e136-8de7-4ff5-a43c-8f6248414056) |

## Quick start

### Prerequisites

ai-trailers requires [Bun](https://bun.sh) to be installed. If you don't have it yet:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Install

```bash
bunx ai-trailers init
```

That's it. ai-trailers will auto-detect which AI tools are in your repo and install the necessary hooks.

## Commands

| Command | Description |
|---------|-------------|
| `ai-trailers init` | Auto-detect AI tools and install all hooks |
| `ai-trailers install <tool>` | Install hook for a specific tool |
| `ai-trailers remove [tool]` | Remove all hooks, or just one tool's hook |
| `ai-trailers status` | Show installation status and pending prompts |
| `ai-trailers log [count]` | Show recent commits with AI trailers (default: 20) |
| `ai-trailers --help` | Show help |
| `ai-trailers --version` | Show version |

## Supported tools

| Tool | Hook Event | Config File |
|------|-----------|-------------|
| Claude Code | `UserPromptSubmit` | `.claude/settings.json` |
| Kiro | `promptSubmit` | `.kiro/hooks/ai-trailers.kiro.hook` |
| Gemini | `BeforeAgent` | `.gemini/settings.json` |
| Codex | `UserPromptSubmit` | `.codex/hooks.json` |

> **Note:** Kiro passes the user prompt via the `USER_PROMPT` environment variable, which strips newlines from multiline prompts. This is a Kiro limitation — multiline prompts will appear as a single line in the trailers.

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `AI_TRAILERS_TIMESTAMP=1` | off | Include UTC timestamps in trailers |

## Example output

A commit message with ai-trailers looks like this:

```
fix: resolve auth redirect loop

AI-Tool: Claude Code
AI-Prompt: fix the login redirect loop that happens when the session expires
 and the user is on a protected route
```

With timestamps enabled (`AI_TRAILERS_TIMESTAMP=1`):

```
fix: resolve auth redirect loop

AI-Tool: Claude Code
AI-Timestamp: 2026-03-24T21:06:31.016Z
AI-Prompt: fix the login redirect loop that happens when the session expires
 and the user is on a protected route
```

## Adding a new tool

Add an entry to the `tools` array in `src/tools.ts`:

```ts
{
  name: "Your Tool",
  markers: [".your-tool"],
  extractPrompt: () => extractFromStdin({ format: "json", path: "prompt" }),
  hook: {
    hookEvent: "PromptSubmit",
    settingsPath: ".your-tool/settings.json",
    generateConfig: () => ({
      hooks: {
        PromptSubmit: [
          {
            command: `bunx ai-trailers capture --tool "Your Tool"`,
          },
        ],
      },
    }),
  },
}
```

Each tool defines how it extracts the prompt via `extractPrompt`. Available helpers from `src/extractors.ts`:

- `extractFromStdin({ format: "json", path: "prompt" })` — parse stdin JSON and read a field by path
- `extractFromStdin({ format: "text" })` — read stdin as plain text
- `extractFromEnv("VAR_NAME")` — read from an environment variable

## License

[MIT](LICENSE)
