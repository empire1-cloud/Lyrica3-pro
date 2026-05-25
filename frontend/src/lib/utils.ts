// Inline cn — no external deps, works with CRA/craco moduleResolution:node
type ClassValue = string | number | boolean | undefined | null | ClassValue[];

function clsx(...args: ClassValue[]): string {
  return args
    .flat(Infinity as 0)
    .filter(Boolean)
    .join(' ');
}

export function cn(...inputs: ClassValue[]): string {
  // Deduplicate Tailwind classes: last one wins per prefix
  const classes = clsx(...inputs).split(' ').filter(Boolean);
  const seen = new Map<string, string>();
  for (const cls of classes) {
    const prefix = cls.replace(/^-/, '').split('-').slice(0, -1).join('-') || cls;
    seen.set(prefix, cls);
  }
  return Array.from(seen.values()).join(' ');
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}
