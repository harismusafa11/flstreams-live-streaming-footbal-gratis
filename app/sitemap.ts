import { MetadataRoute } from 'next';

interface MatchItem {
  source: string;
  id: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.flstreams.my.id';

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
  ];

  try {
    // Attempt to fetch current matches to dynamically index active watch pages
    const res = await fetch('https://streamed.pk/api/matches', {
      next: { revalidate: 60 },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const matches: MatchItem[] = await res.json();
      if (Array.isArray(matches)) {
        matches.forEach((match) => {
          if (match.source && match.id) {
            routes.push({
              url: `${baseUrl}/watch/${match.source}/${match.id}`,
              lastModified: new Date(),
              changeFrequency: 'hourly' as const,
              priority: 0.8,
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('Sitemap matches fetch failed, using home route only:', err);
  }

  return routes;
}
