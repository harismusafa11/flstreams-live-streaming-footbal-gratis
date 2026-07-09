import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Slot } from './fetch';

// Resolve absolute path to the worker file at module load time.
// In Next.js the CWD is the project root, so we resolve relative to this file.
const workerPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'lock-worker.js',
);

/**
 * Spawns the WASM worker, passes encrypted blob + goat key,
 * and resolves with the raw CDN m3u8 URL.
 */
export function unlock(slot: Slot, goat: string, body: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { slot, goat, bodyHex: body.toString('hex') },
    });

    const cleanup = () => worker.terminate().catch(() => {});

    worker.once('message', (msg: { ok: boolean; url?: string; error?: string }) => {
      cleanup();
      if (msg.ok && msg.url) resolve(msg.url);
      else reject(new Error(msg.error ?? 'lock decrypt failed'));
    });

    worker.once('error', (err) => {
      cleanup();
      reject(err);
    });
  });
}
