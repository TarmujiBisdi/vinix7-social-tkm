// Verifies Meta Graph API token by calling /me and optionally /{ig_id} & /{fb_id}
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GRAPH = 'https://graph.facebook.com/v21.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('META_GRAPH_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'META_GRAPH_TOKEN belum dikonfigurasi di backend secret.',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({} as any));
    const ig = (body.ig_account_id || '').toString().trim();
    const fb = (body.fb_page_id || '').toString().trim();

    const result: any = { ok: true, token_ok: false };

    // 1) verify token
    const meRes = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
    const me = await meRes.json();
    if (!meRes.ok || me.error) {
      return new Response(JSON.stringify({
        ok: false,
        error: me.error?.message || 'Token Meta tidak valid.',
        details: me.error,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    result.token_ok = true;
    result.account = { id: me.id, name: me.name };

    // 2) verify IG (business account)
    if (ig) {
      const r = await fetch(`${GRAPH}/${encodeURIComponent(ig)}?fields=id,username,name&access_token=${encodeURIComponent(token)}`);
      const j = await r.json();
      result.instagram = r.ok && !j.error
        ? { ok: true, id: j.id, username: j.username, name: j.name }
        : { ok: false, error: j.error?.message || 'IG account tidak ditemukan / token tidak punya izin.' };
    }

    // 3) verify FB page
    if (fb) {
      const r = await fetch(`${GRAPH}/${encodeURIComponent(fb)}?fields=id,name,category&access_token=${encodeURIComponent(token)}`);
      const j = await r.json();
      result.facebook = r.ok && !j.error
        ? { ok: true, id: j.id, name: j.name, category: j.category }
        : { ok: false, error: j.error?.message || 'FB Page tidak ditemukan / token tidak punya izin.' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
