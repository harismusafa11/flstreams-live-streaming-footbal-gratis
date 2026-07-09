import { pull } from './curl';
import { segmentBody } from './segment';

export interface RelaySlot {
  origin: string;      // embed origin e.g. https://embed.st
  path: string;        // source/id/stream
  referer?: string;    // optional CDN referer override
}

/** Build a relay URL pointing back through our /api/hls route */
export function relayLink(
  serverOrigin: string,
  targetUrl: string,
  slot: RelaySlot,
): string {
  const q = new URLSearchParams({
    url: targetUrl,
    embed: slot.path,
    embedOrigin: slot.origin,
  });
  if (slot.referer) q.set('referer', slot.referer);
  return `${serverOrigin}/api/hls?${q}`;
}

/** Parse relay slot from URL search params */
export function parseRelaySlot(params: URLSearchParams): RelaySlot {
  const path = params.get('embed');
  const origin = params.get('embedOrigin');
  if (!path || !origin) throw new Error('embed and embedOrigin params required');
  const parts = path.split('/');
  if (parts.length !== 3 || parts.some((p) => !p)) throw new Error('invalid embed path');
  const slot: RelaySlot = { origin, path };
  const referer = params.get('referer');
  if (referer) slot.referer = referer;
  return slot;
}

function isPlaylist(body: Buffer): boolean {
  return body.toString('utf8', 0, Math.min(body.length, 256)).includes('#EXTM3U');
}

function toAbs(uri: string, base: string): string {
  return uri.startsWith('http') ? uri : new URL(uri, base).href;
}

/** Rewrite all media lines and URI="" tags to go through our relay */
function rewritePlaylist(
  text: string,
  base: string,
  slot: RelaySlot,
  serverOrigin: string,
): string {
  return text
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith('#')) {
        if (!t.includes('URI="')) return line;
        return t.replace(/URI="([^"]+)"/g, (_, uri) =>
          `URI="${relayLink(serverOrigin, toAbs(uri, base), slot)}"`,
        );
      }
      return relayLink(serverOrigin, toAbs(t, base), slot);
    })
    .join('\n');
}

/**
 * Serve one HLS relay request:
 * - Pulls upstream URL via curl with proper Referer
 * - If playlist: rewrites all lines through relay
 * - If segment: strips PNG wrapper, returns raw video/mp2t
 */
export async function serveHls(
  url: string,
  slot: RelaySlot,
  serverOrigin: string,
): Promise<{ contentType: string; body: Buffer }> {
  const raw = await pull(url, slot);

  if (isPlaylist(raw)) {
    const rewritten = rewritePlaylist(raw.toString('utf8'), url, slot, serverOrigin);
    return {
      contentType: 'application/vnd.apple.mpegurl',
      body: Buffer.from(rewritten, 'utf8'),
    };
  }

  return {
    contentType: 'video/mp2t',
    body: segmentBody(raw),
  };
}
