import { execFile } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import type { SecretStore } from "./secrets";

/**
 * Encapsulated FILE FALLBACK for SecretStore.
 *
 * This is NOT the primary design and is NOT equivalent to an OS keychain.
 * Primary: Windows Credential Manager / OS keychain, accessed only by the local API.
 * Use this module only when the OS store is not viable at runtime.
 *
 * Never log secret values. Keep the file gitignored and permissions restrictive.
 */
export class FileSecretStore implements SecretStore {
  readonly kind = "file" as const;
  readonly isFallback = true as const;
  readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async get(key: string): Promise<string | null> {
    const store = await this.#read();
    return store[key] ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const store = await this.#read();
    store[key] = value;
    await this.#write(store);
  }

  async delete(key: string): Promise<void> {
    const store = await this.#read();
    if (!(key in store)) {
      return;
    }
    delete store[key];
    await this.#write(store);
  }

  async #read(): Promise<Record<string, string>> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!isStringRecord(parsed)) {
        return {};
      }
      return parsed;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  async #write(store: Record<string, string>): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    try {
      await chmod(this.filePath, 0o600);
    } catch {
      // Windows may ignore Unix modes; apply an ACL-only-user fallback when possible.
    }
    await applyRestrictiveFilePermissions(this.filePath);
  }
}

const execFileAsync = promisify(execFile);

async function applyRestrictiveFilePermissions(filePath: string): Promise<void> {
  if (process.platform === "win32") {
    const username = process.env.USERNAME?.trim();
    if (!username) {
      return;
    }
    try {
      await execFileAsync("icacls", [filePath, "/inheritance:r"], { windowsHide: true });
      await execFileAsync("icacls", [filePath, "/grant:r", `${username}:(F)`], {
        windowsHide: true,
      });
    } catch {
      // Best-effort; file remains gitignored and outside version control.
    }
    return;
  }

  try {
    await chmod(filePath, 0o600);
  } catch {
    // Best-effort on platforms that ignore Unix modes.
  }
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === "string");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
