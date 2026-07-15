import type { StreamFreeCategoriesResponse, Sport } from '@/lib/types';

const BASE_URL = 'https://streamfree.top';

/** Friendly display names for StreamFree categories */
const CATEGORY_LABELS: Record<string, string> = {
  soccer: 'Sepak Bola',
  basketball: 'Basket',
  hockey: 'Hoki',
  combat: 'MMA / Tinju',
  baseball: 'Baseball',
  football: 'American Football',
  racing: 'Motorsport',
  tennis: 'Tenis',
  cricket: 'Kriket',
};

export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/categories`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FLStreams/2.0)',
        Accept: 'application/json',
        Referer: 'https://streamfree.top/',
      },
      next: { revalidate: 3600 }, // categories rarely change
    });

    if (!res.ok) {
      return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }

    const data: StreamFreeCategoriesResponse = await res.json();

    const sports: Sport[] = (data.categories ?? []).map((cat) => ({
      id: cat,
      name: CATEGORY_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1),
      slug: cat,
    }));

    return Response.json(sports, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('[/api/sports]', err);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
