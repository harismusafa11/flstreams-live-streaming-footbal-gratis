import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

export interface PullSlot {
  origin: string;
  referer?: string;
}

/**
 * Pull a CDN URL via curl with correct Referer/Origin headers.
 * The CDN (strmd.st, tiktokcdn) blocks bare Node.js fetch requests —
 * curl with a spoofed Referer gets through.
 */
export async function pull(url: string, slot: PullSlot): Promise<Buffer> {
  const referer = slot.referer ?? `${slot.origin}/`;
  const origin = slot.origin;

  const args = [
    '--silent',
    '--fail',
    '--location',
    '--max-time', '15',
    '--user-agent', UA,
    '--header', `Referer: ${referer}`,
    '--header', `Origin: ${origin}`,
    '--output', '-', // write to stdout
    url,
  ];

  const { stdout } = await execFileAsync('curl', args, {
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024, // 20 MB max per segment
  });

  return Buffer.from(stdout);
}
