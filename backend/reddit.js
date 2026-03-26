/**
 * Reddit API client
 * Uses OAuth2 client_credentials flow (no user login needed)
 */

let accessToken   = null;
let tokenExpiry   = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT } = process.env;
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return null;

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
      'User-Agent':  REDDIT_USER_AGENT || 'TrendTracker/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

/**
 * Search Reddit for a keyword, optionally filtered by subreddit list.
 * Returns top posts matching the query.
 */
export async function searchReddit(query, subreddits = [], limit = 10) {
  const token     = await getToken();
  const UA        = process.env.REDDIT_USER_AGENT || 'TrendTracker/1.0';
  const results   = [];

  // Build subreddit scoped searches
  const targets = subreddits.length
    ? subreddits.map(s => ({ sub: s, url: `https://oauth.reddit.com/r/${s}/search?q=${encodeURIComponent(query)}&sort=hot&limit=${limit}&restrict_sr=1&t=week` }))
    : [{ sub: 'all', url: `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&sort=hot&limit=${limit}&t=week` }];

  await Promise.allSettled(
    targets.map(async ({ sub, url }) => {
      const headers = token
        ? { Authorization: `Bearer ${token}`, 'User-Agent': UA }
        : { 'User-Agent': UA };

      const r = await fetch(url, { headers });
      if (!r.ok) return;
      const data = await r.json();

      for (const post of (data?.data?.children || [])) {
        const p = post.data;
        results.push({
          id:         p.id,
          source:     'reddit',
          subreddit:  p.subreddit,
          title:      p.title,
          url:        `https://reddit.com${p.permalink}`,
          upvotes:    p.ups,
          comments:   p.num_comments,
          score:      p.score,
          author:     p.author,
          created:    new Date(p.created_utc * 1000).toISOString(),
          thumbnail:  p.thumbnail !== 'self' && p.thumbnail !== 'default' ? p.thumbnail : null,
          flair:      p.link_flair_text || null,
        });
      }
    })
  );

  // Deduplicate by id
  const seen = new Set();
  return results
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
    .sort((a, b) => b.upvotes - a.upvotes);
}

/**
 * Public fallback: use Reddit's JSON API (no auth, limited)
 */
export async function searchRedditPublic(query, subreddit = 'artificial', limit = 10) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=hot&limit=${limit}&restrict_sr=0&t=week`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TrendTracker/1.0' } });
  if (!res.ok) throw new Error(`Reddit public API error: ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || []).map(post => {
    const p = post.data;
    return {
      id:        p.id,
      source:    'reddit',
      subreddit: p.subreddit,
      title:     p.title,
      url:       `https://reddit.com${p.permalink}`,
      upvotes:   p.ups,
      comments:  p.num_comments,
      score:     p.score,
      author:    p.author,
      created:   new Date(p.created_utc * 1000).toISOString(),
    };
  });
}
