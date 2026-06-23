// Fetch recent comments from Instagram Business + Facebook Page via Meta Graph API
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
};

async function fetchInstagram(token: string, igId: string, mediaLimit: number): Promise<FetchedComment[]> {
  const out: FetchedComment[] = [];
  const mediaRes = await fetch(
    `${GRAPH}/${igId}/media?fields=id,caption,timestamp,like_count,comments_count&limit=${mediaLimit}&access_token=${encodeURIComponent(token)}`
  );
  const media = await mediaRes.json();
  if (!mediaRes.ok || media.error) throw new Error(media.error?.message || 'IG media fetch failed');

  for (const m of (media.data || [])) {
    const caption = (m.caption || 'Instagram Post').slice(0, 80);
    const date = (m.timestamp || '').slice(0, 10);
    const cRes = await fetch(
      `${GRAPH}/${m.id}/comments?fields=id,text,username,timestamp,like_count&limit=25&access_token=${encodeURIComponent(token)}`
    );
    const c = await cRes.json();
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
      });
    }
  }
  return out;
}

async function fetchFacebook(token: string, pageId: string, postLimit: number): Promise<FetchedComment[]> {
  const out: FetchedComment[] = [];
  const postsRes = await fetch(
    `${GRAPH}/${pageId}/posts?fields=id,message,created_time,shares,reactions.summary(true)&limit=${postLimit}&access_token=${encodeURIComponent(token)}`
  );
  const posts = await postsRes.json();
  if (!postsRes.ok || posts.error) throw new Error(posts.error?.message || 'FB posts fetch failed');

  for (const p of (posts.data || [])) {
    const caption = (p.message || 'Facebook Post').slice(0, 80);
    const date = (p.created_time || '').slice(0, 10);
    const cRes = await fetch(
      `${GRAPH}/${p.id}/comments?fields=id,message,from,created_time,like_count&limit=25&access_token=${encodeURIComponent(token)}`
    );
    const c = await cRes.json();
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
      return new Response(JSON.stringify({ ok: false, error: 'META_GRAPH_TOKEN belum dikonfigurasi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({} as any));
    const ig = (body.ig_account_id || '').toString().trim();
    const fb = (body.fb_page_id || '').toString().trim();
    const mediaLimit = Math.min(Math.max(parseInt(body.media_limit) || 5, 1), 10);

    if (!ig && !fb) {
      return new Response(JSON.stringify({ ok: false, error: 'Isi minimal salah satu: IG Account ID atau FB Page ID.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: FetchedComment[] = [];
    const errors: Record<string, string> = {};

    if (ig) {
      try { results.push(...await fetchInstagram(token, ig, mediaLimit)); }
      catch (e) { errors.instagram = (e as Error).message; }
    }
    if (fb) {
      try { results.push(...await fetchFacebook(token, fb, mediaLimit)); }
      catch (e) { errors.facebook = (e as Error).message; }
    }

    return new Response(JSON.stringify({
      ok: true,
      count: results.length,
      comments: results,
      errors: Object.keys(errors).length ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
