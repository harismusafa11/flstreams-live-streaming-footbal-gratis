const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

export interface FetchResult {
  body: Buffer;
  goat: string;
}

export interface Slot {
  origin: string; // https://embed.st
  path: string;   // source/id/streamNo
  source: string;
  id: string;
  stream: string;
  slug: string;
  referer?: string;
}

/**
 * POST embed.st/fetch with protobuf body.
 * Returns encrypted blob + goat header.
 */
export async function postFetch(body: Buffer, slot: Slot): Promise<FetchResult> {
  const referer = `${slot.origin}/embed/${slot.path}`;

  const res = await fetch(`${slot.origin}/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      Origin: slot.origin,
      Referer: referer,
      'User-Agent': UA,
    },
    body: body as unknown as BodyInit,
  });

  if (!res.ok) {
    const detail = (await res.text()).trim() || res.statusText;
    throw new Error(`embed /fetch ${res.status}: ${detail}`);
  }

  const goat = res.headers.get('goat');
  if (!goat) throw new Error('missing goat header in embed.st response');

  return { body: Buffer.from(await res.arrayBuffer()), goat };
}
