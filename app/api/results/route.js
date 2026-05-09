import { fetchAllRoutes } from '@/lib/scraper';

// Cache the results in memory for 30 seconds
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 30 * 1000;

export async function GET() {
  const now = Date.now();

  // Return cached data if fresh enough
  if (cachedData && now - cacheTimestamp < CACHE_DURATION_MS) {
    return Response.json(cachedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  }

  try {
    const data = await fetchAllRoutes();
    cachedData = data;
    cacheTimestamp = now;

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Failed to fetch results:', error);

    // Return stale cache if available
    if (cachedData) {
      return Response.json(
        { ...cachedData, stale: true },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=10',
          },
        }
      );
    }

    return Response.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
