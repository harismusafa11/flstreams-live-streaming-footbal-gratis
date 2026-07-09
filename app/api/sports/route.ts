const BASE_URL = 'https://streamed.pk';

export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/api/sports`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/1.0)' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error('[/api/sports]', err);
    return Response.json({ error: 'Failed to fetch sports' }, { status: 500 });
  }
}
