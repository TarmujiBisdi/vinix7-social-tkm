// Aggregate live engagement metrics from Meta Graph API (FB Page + IG Business)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GRAPH = 'https://graph.facebook.com/v21.0';

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function g(path: string, token: string, query: Record<string, string | number> = {}) {
  const url = new URL(`${GRAPH}/${path.replace(/^\//, '')}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && !data?.error, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({} as any));
    const igIn = (body.ig_account_id || '').toString().trim();
    const fbIn = (body.fb_page_id || '').toString().trim();
    const bodyToken = (body.access_token || '').toString().trim();
    const token = bodyToken || Deno.env.get('META_GRAPH_TOKEN') || '';
    if (!token) return json({ ok: false, error: 'Meta Graph API Token belum diisi. Masukkan token di halaman Pengaturan.' });
    const limit = Math.min(Math.max(parseInt(body.media_limit) || 10, 1), 25);

    // Discover pages
    const pages = await g('/me/accounts', token, {
      fields: 'id,name,access_token,instagram_business_account{id,username,name}',
    });
    const list = Array.isArray(pages.data?.data) ? pages.data.data : [];
    const selected =
      list.find((p: any) => fbIn && p.id === fbIn) ||
      list.find((p: any) => igIn && p.instagram_business_account?.id === igIn) ||
      list[0];

    const fb = selected?.id || fbIn || '';
    const ig = selected?.instagram_business_account?.id || igIn || '';
    const pageToken = selected?.access_token || token;

    if (!fb && !ig) {
      return json({ ok: false, error: 'Tidak ada Facebook Page / IG Business yang bisa diakses token ini.' });
    }

    let likes = 0, views = 0, shares = 0, comments = 0, posts = 0, followers = 0;
    const trend: Record<string, { date: string; likes: number; views: number; shares: number; comments: number }> = {};
    const byCampaign: Array<{ name: string; platform: string; likes: number; views: number; shares: number; comments: number; date: string }> = [];
    const errors: Record<string, string> = {};

    // Facebook page metrics
    if (fb) {
      const page = await g(`${encodeURIComponent(fb)}`, pageToken, { fields: 'fan_count,followers_count,name' });
      if (page.ok) followers += Number(page.data?.followers_count || page.data?.fan_count || 0);

      const posts_ = await g(`${encodeURIComponent(fb)}/posts`, pageToken, {
        fields: 'id,message,created_time,shares,reactions.summary(true),comments.summary(true),insights.metric(post_impressions)',
        limit,
      });
      if (!posts_.ok) errors.facebook = posts_.data?.error?.message || 'FB posts gagal';
      for (const p of (posts_.data?.data || [])) {
        const l = Number(p.reactions?.summary?.total_count || 0);
        const s = Number(p.shares?.count || 0);
        const c = Number(p.comments?.summary?.total_count || 0);
        const v = Number(p.insights?.data?.[0]?.values?.[0]?.value || 0);
        likes += l; shares += s; comments += c; views += v; posts++;
        const d = (p.created_time || '').slice(0, 10);
        if (d) {
          const t = trend[d] ||= { date: d, likes: 0, views: 0, shares: 0, comments: 0 };
          t.likes += l; t.views += v; t.shares += s; t.comments += c;
        }
        byCampaign.push({
          name: (p.message || 'Facebook Post').slice(0, 60),
          platform: 'Facebook', likes: l, views: v, shares: s, comments: c, date: d,
        });
      }
    }

    // Instagram metrics
    if (ig) {
      const acc = await g(`${encodeURIComponent(ig)}`, pageToken, { fields: 'followers_count,username,name' });
      if (acc.ok) followers += Number(acc.data?.followers_count || 0);

      const media = await g(`${encodeURIComponent(ig)}/media`, pageToken, {
        fields: 'id,caption,timestamp,like_count,comments_count,media_type,insights.metric(impressions,reach,video_views)',
        limit,
      });
      if (!media.ok) errors.instagram = media.data?.error?.message || 'IG media gagal';
      for (const m of (media.data?.data || [])) {
        const l = Number(m.like_count || 0);
        const c = Number(m.comments_count || 0);
        const ins = m.insights?.data || [];
        const impressions = Number(ins.find((x: any) => x.name === 'impressions')?.values?.[0]?.value || 0);
        const videoViews = Number(ins.find((x: any) => x.name === 'video_views')?.values?.[0]?.value || 0);
        const v = impressions || videoViews;
        likes += l; comments += c; views += v; posts++;
        const d = (m.timestamp || '').slice(0, 10);
        if (d) {
          const t = trend[d] ||= { date: d, likes: 0, views: 0, shares: 0, comments: 0 };
          t.likes += l; t.views += v; t.comments += c;
        }
        byCampaign.push({
          name: (m.caption || 'Instagram Post').slice(0, 60),
          platform: 'Instagram', likes: l, views: v, shares: 0, comments: c, date: d,
        });
      }
    }

    const engagementRate = views > 0 ? ((likes + shares + comments) / views) * 100 : 0;

    return json({
      ok: true,
      summary: { likes, views, shares, comments, posts, followers, engagementRate },
      trend: Object.values(trend).sort((a, b) => a.date.localeCompare(b.date)),
      campaigns: byCampaign.sort((a, b) => (b.likes + b.views + b.shares) - (a.likes + a.views + a.shares)).slice(0, 8),
      used: { ig_account_id: ig || undefined, fb_page_id: fb || undefined, page_name: selected?.name },
      errors: Object.keys(errors).length ? errors : undefined,
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message });
  }
});
