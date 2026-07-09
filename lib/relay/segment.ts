/**
 * tiktokcdn wraps MPEG-TS segments inside a PNG container.
 * Strip the PNG wrapper to get raw transport stream bytes.
 */

function findTsStart(buf: Buffer): number {
  // MPEG-TS sync byte is 0x47, packets are 188 bytes each
  for (let i = 0; i < Math.min(buf.length, 65536); i++) {
    if (buf[i] === 0x47 && i + 188 < buf.length && buf[i + 188] === 0x47) return i;
  }
  return -1;
}

function strip(buf: Buffer): Buffer {
  // Already a raw TS segment
  if (buf.length < 4 || buf[0] === 0x47) return buf;

  // PNG magic: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const iend = buf.indexOf(Buffer.from('IEND'));
    if (iend >= 0 && iend + 8 < buf.length) return buf.subarray(iend + 8);
  }

  // Fallback: scan for TS sync byte
  const at = findTsStart(buf);
  if (at >= 0) return buf.subarray(at);

  return buf;
}

export function segmentBody(body: Buffer): Buffer {
  const out = strip(body);
  if (out.length >= 188 && out[0] === 0x47) return out;
  throw new Error('invalid segment payload — not MPEG-TS');
}
