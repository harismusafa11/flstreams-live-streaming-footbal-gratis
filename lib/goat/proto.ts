// Encodes source/id/stream as a minimal protobuf binary (3 string fields)
function varint(n: number): Buffer {
  const bytes: number[] = [];
  let v = n;
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v);
  return Buffer.from(bytes);
}

function fieldStr(out: Buffer[], field: number, value: string) {
  const body = Buffer.from(String(value), 'utf8');
  out.push(Buffer.from([(field << 3) | 2]));
  out.push(varint(body.length));
  out.push(body);
}

export function encodeBody(source: string, id: string, stream: string): Buffer {
  const out: Buffer[] = [];
  fieldStr(out, 1, source);
  fieldStr(out, 2, id);
  fieldStr(out, 3, stream);
  return Buffer.concat(out);
}
