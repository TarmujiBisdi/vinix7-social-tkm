import { useEffect, useMemo, useState } from "react";
import { useComments, useSettings } from "@/hooks/useComments";
import { StatCard } from "@/components/StatCard";
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Heart, Eye, Activity, Lightbulb, Sparkles, RefreshCw, AlertCircle, Loader2, Share2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type MetaInsights = {
  summary: { likes: number; views: number; shares: number; comments: number; posts: number; followers: number; engagementRate: number };
  trend: Array<{ date: string; likes: number; views: number; shares: number; comments: number }>;
  campaigns: Array<{ name: string; platform: string; likes: number; views: number; shares: number; comments: number; date: string }>;
  used?: { ig_account_id?: string; fb_page_id?: string; page_name?: string };
  errors?: Record<string, string>;
};

const Dashboard = () => {
  const comments = useComments();
  const settings = useSettings();
  const [meta, setMeta] = useState<MetaInsights | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const loadMeta = async () => {
    setLoadingMeta(true);
    setMetaError(null);
    try {
      const { data, error } = await supabase.functions.invoke("meta-insights", {
        body: {
          ig_account_id: settings.ig_account_id || "",
          fb_page_id: settings.fb_page_id || "",
          access_token: settings.meta_api_token || "",
          media_limit: 10,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "Gagal memuat data Meta");
      setMeta(data as MetaInsights);
      if (data?.errors) {
        const msgs = Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join(" | ");
        toast.warning("Sebagian data Meta tidak terambil", { description: msgs });
      }
    } catch (e: any) {
      setMetaError(e?.message || "Gagal terhubung ke Meta Graph API");
      setMeta(null);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.ig_account_id, settings.fb_page_id]);

  const sentimentStats = useMemo(() => {
    const positif = comments.filter(c=>c.sentiment_status==="positif").length;
    const negatif = comments.filter(c=>c.sentiment_status==="negatif").length;
    const netral = comments.filter(c=>c.sentiment_status==="netral").length;
    return { positif, negatif, netral, total: comments.length };
  }, [comments]);

  const liveStats = meta?.summary ?? { likes: 0, views: 0, shares: 0, comments: 0, posts: 0, followers: 0, engagementRate: 0 };

  const pieData = [
    { name: "Positif", value: sentimentStats.positif, color: "hsl(var(--sentiment-positive))" },
    { name: "Negatif", value: sentimentStats.negatif, color: "hsl(var(--sentiment-negative))" },
    { name: "Netral", value: sentimentStats.netral, color: "hsl(var(--sentiment-neutral))" },
  ].filter(d => d.value > 0);

  const campaignData = useMemo(() => {
    if (!meta?.campaigns?.length) return [];
    return meta.campaigns.slice(0, 6).map(c => ({
      name: c.name.slice(0, 24) + (c.name.length > 24 ? "…" : ""),
      likes: c.likes, views: c.views, shares: c.shares,
    }));
  }, [meta]);

  const trendData = useMemo(() => {
    if (!meta?.trend?.length) return [];
    return meta.trend.slice(-10).map(t => ({
      ...t,
      label: format(parseISO(t.date), "dd MMM", { locale: localeId }),
    }));
  }, [meta]);

  const insight = useMemo(() => {
    if (!meta) return "Memuat data live dari Meta Graph API…";
    const s = meta.summary;
    if (s.posts === 0) return "Belum ada postingan terbaca dari Meta. Pastikan Page/IG ID benar dan token punya izin yang sesuai.";
    return `${s.posts} postingan terakhir menghasilkan ${s.likes.toLocaleString("id-ID")} likes, ${s.comments.toLocaleString("id-ID")} komentar, ${s.views.toLocaleString("id-ID")} views. Engagement rate ${s.engagementRate.toFixed(2)}%.`;
  }, [meta]);

  const recommendation = useMemo(() => {
    if (!meta) return "Hubungkan token & ID di halaman Pengaturan jika belum terisi.";
    const s = meta.summary;
    if (s.engagementRate < 1) return "Engagement rate rendah. Coba postingan dengan pertanyaan terbuka atau CTA yang jelas.";
    if (sentimentStats.negatif > sentimentStats.positif) return "Sentimen negatif dominan. Tinjau konten kontroversial dan respon komentar dengan cepat.";
    if (s.shares < s.likes * 0.05) return "Shares rendah dibanding likes. Buat konten yang lebih mudah dibagikan (tips, infografis).";
    return "Pertahankan momentum dengan konsistensi posting & engagement langsung dengan komentar audiens.";
  }, [meta, sentimentStats]);

  return (
    <div className="space-y-6">
      {/* Live Meta header */}
      <div className="rounded-2xl border bg-card p-5 shadow-elegant">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs mb-2">
              <Sparkles className="h-3 w-3 text-accent" /> {settings.company_name} · Live dari Meta Graph API
            </div>
            <h2 className="text-xl lg:text-2xl font-bold">Ringkasan Performa Media Sosial</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {meta?.used?.page_name ? `Page: ${meta.used.page_name}` : "Data ditarik real-time dari akun Meta yang terhubung."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadMeta} disabled={loadingMeta}>
            {loadingMeta ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Meta
          </Button>
        </div>

        {metaError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Gagal terhubung ke Meta Graph API</p>
              <p className="text-xs opacity-80">{metaError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Live engagement cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Total Likes (Live)" value={liveStats.likes.toLocaleString("id-ID")} accent="accent" hint={`${liveStats.posts} postingan`} />
        <StatCard icon={Eye} label="Total Views (Live)" value={liveStats.views.toLocaleString("id-ID")} accent="primary" hint="Impressions / video views" />
        <StatCard icon={Share2} label="Total Shares (Live)" value={liveStats.shares.toLocaleString("id-ID")} accent="success" />
        <StatCard icon={MessageSquare} label="Komentar (Live)" value={liveStats.comments.toLocaleString("id-ID")} accent="primary" />
        <StatCard icon={Activity} label="Engagement Rate" value={`${liveStats.engagementRate.toFixed(2)}%`} accent="success" hint="(likes+shares+komentar)/views" />
        <StatCard icon={Sparkles} label="Followers" value={liveStats.followers.toLocaleString("id-ID")} accent="accent" />
        <StatCard icon={ThumbsUp} label="Sentimen Positif" value={sentimentStats.positif} accent="success" hint={`${sentimentStats.total ? ((sentimentStats.positif/sentimentStats.total)*100).toFixed(0) : 0}% dari analisis`} />
        <StatCard icon={ThumbsDown} label="Sentimen Negatif" value={sentimentStats.negatif} accent="destructive" hint={`${sentimentStats.total ? ((sentimentStats.negatif/sentimentStats.total)*100).toFixed(0) : 0}% dari analisis`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-elegant lg:col-span-1">
          <h3 className="font-bold">Distribusi Sentimen</h3>
          <p className="text-xs text-muted-foreground mb-4">Hasil analisis Naive Bayes</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-40" />
              Belum ada hasil analisis. Tarik komentar dari Meta lalu jalankan analisis.
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-elegant lg:col-span-2">
          <h3 className="font-bold">Engagement per Postingan (Live)</h3>
          <p className="text-xs text-muted-foreground mb-4">Likes, views, & shares dari Meta Graph API</p>
          {campaignData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="likes" stackId="a" fill="hsl(var(--accent))" />
                <Bar dataKey="shares" stackId="a" fill="hsl(var(--success))" />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-40" />
              {loadingMeta ? "Memuat data Meta…" : "Belum ada postingan terbaca dari Meta."}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-elegant">
        <h3 className="font-bold">Tren Engagement Harian (Live)</h3>
        <p className="text-xs text-muted-foreground mb-4">Pergerakan likes, views, komentar dari Meta</p>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="comments" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-40" />
            {loadingMeta ? "Memuat tren…" : "Belum ada data tren dari Meta."}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-gradient-to-br from-accent/10 to-transparent p-5 shadow-elegant">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white"><Lightbulb className="h-4 w-4" /></div>
            <h3 className="font-bold">Insight Live</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-success/10 to-transparent p-5 shadow-elegant">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success text-white"><Sparkles className="h-4 w-4" /></div>
            <h3 className="font-bold">Rekomendasi Tindakan</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
