// Fetch recent comments from Instagram Business + Facebook Page via Meta Graph API.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GRAPH = 'https://graph.facebook.com/v21.0';

type FetchedComment = {
  platform: 'Instagram' | 'Facebook';
  campaign_name: string;
  post_date: string;
  username: string;
  comment_text: string;
  likes: number;
  views: number;
  shares: number;
  external_id: string;
  source: 'meta';
};

type MetaPage = {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: { id: string; username?: string; name?: string };
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function graphJson(path: string, token: string, query: Record<string, string | number> = {}) {
  const url = new URL(`${GRAPH}/${path.replace(/^\//, '')}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  url.searchParams.set('access_token', token);

  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function discoverPages(token: string): Promise<MetaPage[]> {
  const { res, data } = await graphJson('/me/accounts', token, {
    fields: 'id,name,access_token,instagram_business_account{id,username,name}',
  });
  if (!res.ok || data?.error) return [];
  return Array.isArray(data?.data) ? data.data : [];
}

async function fetchInstagram(token: string, igId: string, mediaLimit: number): Promise<FetchedComment[]> {
  const out: FetchedComment[] = [];
  const { res: mediaRes, data: media } = await graphJson(`${encodeURIComponent(igId)}/media`, token, {
    fields: 'id,caption,timestamp,like_count,comments_count',
    limit: mediaLimit,
  });
  if (!mediaRes.ok || media.error) throw new Error(media.error?.message || 'IG media fetch failed');

  for (const m of (media.data || [])) {
    const caption = (m.caption || 'Instagram Post').slice(0, 80);
    const date = (m.timestamp || '').slice(0, 10);
    const { res: cRes, data: c } = await graphJson(`${encodeURIComponent(m.id)}/comments`, token, {
      fields: 'id,text,username,timestamp,like_count',
      limit: 25,
    });
    if (!cRes.ok || c.error) continue;
    for (const cm of (c.data || [])) {
      if (!cm.text) continue;
      out.push({
        platform: 'Instagram',
        campaign_name: caption,
        post_date: (cm.timestamp || m.timestamp || '').slice(0, 10) || date,
        username: '@' + (cm.username || 'ig_user'),
        comment_text: cm.text,
        likes: cm.like_count || 0,
        views: 0,
        shares: 0,
        external_id: `ig_${cm.id}`,
        source: 'meta',
      });
    }
  }
  return out;
}

async function fetchFacebook(token: string, pageId: string, postLimit: number): Promise<FetchedComment[]> {
  const out: FetchedComment[] = [];
  const { res: postsRes, data: posts } = await graphJson(`${encodeURIComponent(pageId)}/posts`, token, {
    fields: 'id,message,created_time,shares,reactions.summary(true)',
    limit: postLimit,
  });
  if (!postsRes.ok || posts.error) throw new Error(posts.error?.message || 'FB posts fetch failed');

  for (const p of (posts.data || [])) {
    const caption = (p.message || 'Facebook Post').slice(0, 80);
    const date = (p.created_time || '').slice(0, 10);
    const { res: cRes, data: c } = await graphJson(`${encodeURIComponent(p.id)}/comments`, token, {
      fields: 'id,message,from,created_time,like_count',
      limit: 25,
    });
    if (!cRes.ok || c.error) continue;
    for (const cm of (c.data || [])) {
      if (!cm.message) continue;
      out.push({
        platform: 'Facebook',
        campaign_name: caption,
        post_date: (cm.created_time || p.created_time || '').slice(0, 10) || date,
        username: '@' + (cm.from?.name?.replace(/\s+/g, '_').toLowerCase() || 'fb_user'),
        comment_text: cm.message,
        likes: cm.like_count || 0,
        views: 0,
        shares: p.shares?.count || 0,
        external_id: `fb_${cm.id}`,
        source: 'meta',
      });
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('META_GRAPH_TOKEN');
    if (!token) {
      return json({ ok: false, error: 'META_GRAPH_TOKEN belum dikonfigurasi.' });
    }

    const body = await req.json().catch(() => ({} as any));
    const ig = (body.ig_account_id || '').toString().trim();
    const fb = (body.fb_page_id || '').toString().trim();
    const mediaLimit = Math.min(Math.max(parseInt(body.media_limit) || 5, 1), 10);

    const pages = await discoverPages(token);
    const selectedPage = fb
      ? pages.find((p) => p.id === fb)
      : pages.find((p) => p.instagram_business_account?.id === ig) || pages[0];
    const effectiveFb = fb || selectedPage?.id || '';
    const effectiveIg = ig || selectedPage?.instagram_business_account?.id || '';
    const pageToken = selectedPage?.access_token || token;

    if (!effectiveIg && !effectiveFb) {
      return json({ ok: false, error: 'Tidak ada IG Business Account atau Facebook Page yang bisa dibaca dari token ini.' });
    }

    const results: FetchedComment[] = [];
    const errors: Record<string, string> = {};

    if (effectiveIg) {
      try { results.push(...await fetchInstagram(pageToken, effectiveIg, mediaLimit)); }
      catch (e) { errors.instagram = (e as Error).message; }
    }
    if (effectiveFb) {
      try { results.push(...await fetchFacebook(pageToken, effectiveFb, mediaLimit)); }
      catch (e) { errors.facebook = (e as Error).message; }
    }

    return json({
      ok: true,
      count: results.length,
      comments: results,
      used: { ig_account_id: effectiveIg || undefined, fb_page_id: effectiveFb || undefined },
      errors: Object.keys(errors).length ? errors : undefined,
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message });
  }
});
