// Verifies Meta Graph API token and discovers available Facebook Pages / Instagram Business accounts.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GRAPH = 'https://graph.facebook.com/v21.0';

type MetaPage = {
  id: string;
  name?: string;
  category?: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
  };
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function graphGet(path: string, token: string, fields?: string) {
  const url = new URL(`${GRAPH}/${path.replace(/^\//, '')}`);
  if (fields) url.searchParams.set('fields', fields);
  url.searchParams.set('access_token', token);

  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function discoverPages(token: string): Promise<{ pages: MetaPage[]; error?: string }> {
  const { res, data } = await graphGet(
    '/me/accounts',
    token,
    'id,name,category,access_token,instagram_business_account{id,username,name}',
  );

  if (!res.ok || data?.error) {
    return { pages: [], error: data?.error?.message || 'Tidak bisa membaca daftar Facebook Page dari token ini.' };
  }

  return { pages: Array.isArray(data?.data) ? data.data : [] };
}

function publicPage(page: MetaPage) {
  const { access_token: _token, ...safe } = page;
  return safe;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Require an authenticated caller
  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return json({ ok: false, error: 'Unauthorized' }, 401);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ ok: false, error: 'Unauthorized' }, 401);

  try {
    const body = await req.json().catch(() => ({} as any));
    const ig = (body.ig_account_id || '').toString().trim();
    const fb = (body.fb_page_id || '').toString().trim();
    const bodyToken = (body.access_token || '').toString().trim();
    const token = bodyToken || Deno.env.get('META_GRAPH_TOKEN') || '';
    if (!token) {
      return json({
        ok: false,
        token_ok: false,
        error: 'Meta Graph API Token belum diisi. Masukkan token di halaman Pengaturan.',
      });
    }

    const result: any = {
      ok: true,
      token_ok: false,
      can_fetch: false,
      discovered_pages: [],
    };

    // 1) verify token
    const { res: meRes, data: me } = await graphGet('/me', token, 'id,name');
    if (!meRes.ok || me.error) {
      return json({
        ok: false,
        token_ok: false,
        error: me.error?.message || 'Token Meta tidak valid.',
        details: me.error,
      });
    }
    result.token_ok = true;
    result.account = { id: me.id, name: me.name };

    // 2) discover pages and IG accounts available to the token.
    const discovery = await discoverPages(token);
    result.discovered_pages = discovery.pages.map(publicPage);
    if (discovery.error) result.discovery_warning = discovery.error;

    const pageById = fb ? discovery.pages.find((p) => p.id === fb) : undefined;
    const pageWithIg = discovery.pages.find((p) => !!p.instagram_business_account);
    const igById = ig
      ? discovery.pages.find((p) => p.instagram_business_account?.id === ig)?.instagram_business_account
      : undefined;

    if (!fb && discovery.pages.length === 1) {
      const page = discovery.pages[0];
      result.facebook = {
        ok: true,
        discovered: true,
        id: page.id,
        name: page.name,
        category: page.category,
        instagram_business_account: page.instagram_business_account,
      };
    }

    if (!ig && pageWithIg?.instagram_business_account) {
      const account = pageWithIg.instagram_business_account;
      result.instagram = {
        ok: true,
        discovered: true,
        id: account.id,
        username: account.username,
        name: account.name,
        connected_page_id: pageWithIg.id,
      };
    }

    // 3) verify IG Business Account ID, if provided.
    if (ig) {
      if (igById) {
        const connectedPage = discovery.pages.find((p) => p.instagram_business_account?.id === ig);
        result.instagram = {
          ok: true,
          id: igById.id,
          username: igById.username,
          name: igById.name,
          connected_page_id: connectedPage?.id,
        };
      } else {
        const { res: r, data: j } = await graphGet(encodeURIComponent(ig), token, 'id,username,name');
        result.instagram = r.ok && !j.error
          ? { ok: true, id: j.id, username: j.username, name: j.name }
          : {
              ok: false,
              error: j.error?.message || 'IG Business Account ID tidak ditemukan pada token ini.',
              suggestion: pageWithIg?.instagram_business_account
                ? `IG ID yang terdeteksi: ${pageWithIg.instagram_business_account.id}`
                : 'Pastikan Instagram sudah tipe Business/Creator dan terhubung ke Facebook Page.',
            };
      }
    }

    // 4) verify Facebook Page ID, if provided.
    if (fb) {
      if (pageById) {
        result.facebook = {
          ok: true,
          id: pageById.id,
          name: pageById.name,
          category: pageById.category,
          instagram_business_account: pageById.instagram_business_account,
        };
      } else {
        const { res: r, data: j } = await graphGet(
          encodeURIComponent(fb),
          token,
          'id,name,category,instagram_business_account{id,username,name}',
        );
        result.facebook = r.ok && !j.error
          ? { ok: true, id: j.id, name: j.name, category: j.category, instagram_business_account: j.instagram_business_account }
          : {
              ok: false,
              error: j.error?.message || 'Facebook Page ID tidak ditemukan pada token ini.',
              suggestion: discovery.pages.length
                ? `Page ID yang terdeteksi: ${discovery.pages.map((p) => p.id).join(', ')}`
                : 'Pastikan token memiliki permission pages_show_list dan pages_read_engagement.',
            };
      }
    }

    if (ig && fb && result.instagram?.ok && result.facebook?.ok) {
      const expectedIg = result.facebook.instagram_business_account?.id;
      if (expectedIg && expectedIg !== result.instagram.id) {
        result.can_fetch = false;
        result.warning = 'Instagram Business Account ID tidak terhubung ke Facebook Page ID yang diisi.';
      } else {
        result.can_fetch = true;
      }
    } else {
      result.can_fetch = !!(result.instagram?.ok || result.facebook?.ok);
    }

    return json(result);
  } catch (e) {
    return json({ ok: false, token_ok: false, error: (e as Error).message });
  }
});
