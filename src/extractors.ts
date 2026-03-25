const STDIN_TIMEOUT_MS = 3000;

// --- Stdin options ---

type StdinJsonOptions = {
  format: "json";
  path: string;
};

type StdinTextOptions = {
  format: "text";
};

type StdinOptions = StdinJsonOptions | StdinTextOptions;

// --- Extraction functions ---

export async function extractFromStdin(options: StdinOptions): Promise<string | null> {
  const raw = await readStdin();
  if (!raw) return null;

  if (options.format === "text") {
    return raw.trim() || null;
  }

  try {
    const data = JSON.parse(raw);
    const value = resolvePath(data, options.path);
    return typeof value === "string" ? value.trim() || null : null;
  } catch {
    return null;
  }
}

export function extractFromEnv(varName: string): Promise<string | null> {
  const value = process.env[varName]?.trim();
  return Promise.resolve(value || null);
}

// --- Internal helpers ---

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

async function readStdin(): Promise<string | null> {
  const chunks: Buffer[] = [];
  const reader = Bun.stdin.stream().getReader();

  try {
    while (true) {
      const result = await Promise.race([
        reader.read(),
        new Promise<{ done: true; value: undefined }>((resolve) =>
          setTimeout(() => resolve({ done: true, value: undefined }), STDIN_TIMEOUT_MS)
        ),
      ]);

      if (result.done) break;
      chunks.push(Buffer.from(result.value));
    }
  } finally {
    reader.releaseLock();
  }

  if (chunks.length === 0) return null;
  return Buffer.concat(chunks).toString("utf-8");
}
