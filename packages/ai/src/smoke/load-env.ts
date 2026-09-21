import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads key=value pairs from the local API bootstrap file for smoke tests only.
 * Never logs values.
 */
export function loadApiBootstrapEnv(): void {
  const envPath = resolve(import.meta.dirname, "../../../../apps/api/.env");
  let raw: string;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
