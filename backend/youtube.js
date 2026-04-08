/**
 * YouTube Data API v3 client
 */

const BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search YouTube for videos matching a query.
 * Returns enriched results with view/like counts.
 */
export async function searchYouTube(query, maxResults = 10) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY not set');

  // Step 1: search
  const searchUrl = `${BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&publishedAfter=${sevenDaysAgo()}&maxResults=${maxResults}&key=${key}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const err = await searchRes.json();
    throw new Error(`YouTube search error: ${err?.error?.message || searchRes.status}`);
  }
  const searchData = await searchRes.json();
  const items = searchData.items || [];
  if (!items.length) return [];

  // Step 2: get stats (views, likes) + full snippet (incl. updatedAt) for all video IDs
  const ids = items.map(i => i.id.videoId).join(',');
  const statsUrl = `${BASE}/videos?part=statistics,snippet,contentDetails&id=${ids}&key=${key}`;
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();
  const statsMap = {};
  for (const v of (statsData.items || [])) {
    statsMap[v.id] = { stats: v.statistics, snippet: v.snippet };
  }

  return items.map(item => {
    const id      = item.id.videoId;
    const snip    = item.snippet;
    const full    = statsMap[id] || {};
    const stats   = full.stats   || {};
    const fsnip   = full.snippet || snip;
    return {
      id,
      source:       'youtube',
      title:        fsnip.title || snip.title,
      channel:      fsnip.channelTitle || snip.channelTitle,
      description:  (fsnip.description || snip.description)?.slice(0, 200),
      url:          `https://www.youtube.com/watch?v=${id}`,
      thumbnail:    snip.thumbnails?.medium?.url || snip.thumbnails?.default?.url,
      published:    fsnip.publishedAt || snip.publishedAt,
      // YouTube levert geen expliciete "last updated" per video via de public API,
      // maar we slaan de polltijdstip op als referentie
      views:        parseInt(stats.viewCount)    || 0,
      likes:        parseInt(stats.likeCount)    || 0,
      comments:     parseInt(stats.commentCount) || 0,
    };
  }).sort((a, b) => b.views - a.views);
}

function sevenDaysAgo() {
  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return d.toISOString();
}
