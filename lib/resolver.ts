/**
 * FL Streams HLS Resolver
 *
 * Chain:
 *   1. streamed.pk /api/stream/{source}/{id}  → embedUrl + streamNo
 *   2. POST embed.st/fetch (protobuf body)     → encrypted blob + goat header
 *   3. lock.wasm (worker thread)               → raw CDN m3u8 URL
 *   4. Return m3u8 + relay URL (our /api/hls proxy)
 */

import { encodeBody } from './goat/proto';
import { postFetch, type Slot } from './goat/fetch';
import { unlock } from './goat/lock';
import { relayLink, type RelaySlot } from './relay/m3u8';

const STREAMED_ORIGIN = 'https://streamed.pk';
const EMBED_ORIGIN = 'https://embed.st';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

export interface StreamLink {
  streamNo: number;
  id: string;
  source: string;
  embedUrl: string;
  hd?: boolean;
  language?: string;
}

export interface ResolveResult {
  ok: true;
  source: string;
  id: string;
  stream: string;
  m3u8: string;
  relay: string;
  embedUrl: string;
}

export interface ResolveError {
  ok: false;
  stage: 'fetch_links' | 'fetch_embed' | 'decrypt' | 'input';
  error: string;
}

/** Fetch stream links from streamed.pk (server-side, no CF block on /api/stream) */
export async function fetchStreamLinks(
  source: string,
  id: string,
): Promise<StreamLink[]> {
  const res = await fetch(
    `${STREAMED_ORIGIN}/api/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
    {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        Referer: `${STREAMED_ORIGIN}/`,
        Origin: STREAMED_ORIGIN,
      },
    },
  );
  if (!res.ok) throw new Error(`streamed.pk /api/stream ${res.status}`);
  return res.json();
}

/** Full resolve: source+id+streamNo → m3u8 + relay URL */
export async function resolveStream(
  source: string,
  id: string,
  streamNo: number | string,
  serverOrigin: string,
): Promise<ResolveResult | ResolveError> {
  // 1. Fetch stream links from streamed.pk
  let links: StreamLink[];
  try {
    links = await fetchStreamLinks(source, id);
  } catch (err) {
    return {
      ok: false,
      stage: 'fetch_links',
      error: String((err as Error).message ?? err),
    };
  }

  const wanted = Number(streamNo);
  const link = links.find((l) => Number(l.streamNo) === wanted) ?? links[0];
  if (!link) {
    return { ok: false, stage: 'input', error: `stream ${streamNo} not found` };
  }

  // 2. Build embed slot
  const slot: Slot = {
    origin: EMBED_ORIGIN,
    path: `${link.source}/${link.id}/${link.streamNo}`,
    source: link.source,
    id: link.id,
    stream: String(link.streamNo),
    slug: link.id,
  };

  // 3. POST embed.st/fetch
  let fetchResult: Awaited<ReturnType<typeof postFetch>>;
  try {
    const protoBody = encodeBody(slot.source, slot.id, slot.stream);
    fetchResult = await postFetch(protoBody, slot);
  } catch (err) {
    return {
      ok: false,
      stage: 'fetch_embed',
      error: String((err as Error).message ?? err),
    };
  }

  // 4. WASM decrypt in worker thread → raw m3u8 URL
  let m3u8: string;
  try {
    m3u8 = await unlock(slot, fetchResult.goat, fetchResult.body);
  } catch (err) {
    return {
      ok: false,
      stage: 'decrypt',
      error: String((err as Error).message ?? err),
    };
  }

  const relaySlot: RelaySlot = { origin: EMBED_ORIGIN, path: slot.path };
  const relay = relayLink(serverOrigin, m3u8, relaySlot);

  return {
    ok: true,
    source: slot.source,
    id: slot.id,
    stream: slot.stream,
    m3u8,
    relay,
    embedUrl: link.embedUrl,
  };
}

/** Fetch all stream links for a match, resolve each to its relay URL */
export async function resolveAllStreams(
  source: string,
  id: string,
  serverOrigin: string,
): Promise<(ResolveResult | ResolveError)[]> {
  let links: StreamLink[];
  try {
    links = await fetchStreamLinks(source, id);
  } catch (err) {
    return [{ ok: false, stage: 'fetch_links', error: String((err as Error).message) }];
  }

  // Resolve all streams in parallel
  return Promise.all(
    links.map((l) => resolveStream(source, id, l.streamNo, serverOrigin)),
  );
}
