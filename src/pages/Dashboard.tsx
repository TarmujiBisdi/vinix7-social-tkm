import { useMemo } from "react";
import { useComments, useSettings } from "@/hooks/useComments";
import { StatCard } from "@/components/StatCard";
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Heart, Eye, Activity, Lightbulb, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

const Dashboard = () => {
  const comments = useComments();
  const settings = useSettings();

  const stats = useMemo(() => {
    const positif = comments.filter(c=>c.sentiment_status==="positif").length;
    const negatif = comments.filter(c=>c.sentiment_status==="negatif").length;
    const netral = comments.filter(c=>c.sentiment_status==="netral").length;
    const likes = comments.reduce((a,c)=>a+c.likes,0);
    const views = comments.reduce((a,c)=>a+c.views,0);
    const shares = comments.reduce((a,c)=>a+c.shares,0);
    const engagementRate = views > 0 ? ((likes + shares + comments.length) / views) * 100 : 0;
    return { positif, negatif, netral, likes, views, shares, total: comments.length, engagementRate };
  }, [comments]);

  const pieData = [
    { name: "Positif", value: stats.positif, color: "hsl(var(--sentiment-positive))" },
    { name: "Negatif", value: stats.negatif, color: "hsl(var(--sentiment-negative))" },
    { name: "Netral", value: stats.netral, color: "hsl(var(--sentiment-neutral))" },
  ].filter(d => d.value > 0);

  const campaignData = useMemo(() => {
    const map = new Map<string, { name: string; likes: number; views: number; shares: number }>();
    for (const c of comments) {
      const prev = map.get(c.campaign_name) ?? { name: c.campaign_name, likes: 0, views: 0, shares: 0 };
      prev.likes += c.likes; prev.views += c.views; prev.shares += c.shares;
      map.set(c.campaign_name, prev);
    }
    return [...map.values()].slice(0, 6);
  }, [comments]);

  const trendData = useMemo(() => {
    const byDate = new Map<string, { date: string; positif: number; negatif: number; netral: number }>();
    for (const c of comments) {
      const d = c.post_date;
      const prev = byDate.get(d) ?? { date: d, positif: 0, negatif: 0, netral: 0 };
      if (c.sentiment_status === "positif") prev.positif++;
      else if (c.sentiment_status === "negatif") prev.negatif++;
      else if (c.sentiment_status === "netral") prev.netral++;
      byDate.set(d, prev);
    }
    return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-10).map(d => ({
      ...d, label: format(parseISO(d.date), "dd MMM", { locale: localeId })
    }));
  }, [comments]);

  const insight = useMemo(() => {
    if (stats.total === 0) return "Belum ada data. Tambahkan komentar untuk memulai analisis.";
    if (stats.positif === 0 && stats.negatif === 0 && stats.netral === 0) return "Data tersedia namun belum dianalisis. Jalankan analisis sentimen untuk melihat insight.";
    const dominant = [["Positif",stats.positif],["Negatif",stats.negatif],["Netral",stats.netral]].sort((a:any,b:any)=>b[1]-a[1])[0];
    return `Sentimen ${dominant[0]} mendominasi dengan ${dominant[1]} komentar dari total ${stats.total}. Engagement rate hari ini ${stats.engagementRate.toFixed(2)}%.`;
  }, [stats]);

  const recommendation = useMemo(() => {
    if (stats.negatif > stats.positif) return "Evaluasi konten yang menerima komentar negatif & respon cepat untuk meredam isu.";
    if (stats.positif > stats.negatif + stats.netral) return "Tingkatkan frekuensi konten dengan gaya serupa untuk mempertahankan momentum positif.";
    return "Tambahkan call-to-action dan pertanyaan terbuka untuk meningkatkan interaksi audiens.";
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 lg:p-8 text-white shadow-elevated">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, hsl(262 83% 58% / .6), transparent 50%)" }} />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs backdrop-blur-sm mb-3">
              <Sparkles className="h-3 w-3 text-accent" /> {settings.company_name}
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold">Ringkasan Performa Hari Ini</h2>
            <p className="text-white/70 mt-1 max-w-xl">Pantau respon audiens lintas platform & ambil keputusan strategis berbasis data.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">Komentar</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">Engagement</p>
              <p className="text-2xl font-bold">{stats.engagementRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">Reach</p>
              <p className="text-2xl font-bold">{(stats.views/1000).toFixed(1)}k</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total Komentar" value={stats.total} accent="primary" trend={5.4} />
        <StatCard icon={ThumbsUp} label="Sentimen Positif" value={stats.positif} accent="success" hint={`${stats.total ? ((stats.positif/stats.total)*100).toFixed(0) : 0}% dari total`} />
        <StatCard icon={ThumbsDown} label="Sentimen Negatif" value={stats.negatif} accent="destructive" hint={`${stats.total ? ((stats.negatif/stats.total)*100).toFixed(0) : 0}% dari total`} />
        <StatCard icon={Minus} label="Sentimen Netral" value={stats.netral} accent="muted" hint={`${stats.total ? ((stats.netral/stats.total)*100).toFixed(0) : 0}% dari total`} />
        <StatCard icon={Heart} label="Total Likes" value={stats.likes.toLocaleString("id-ID")} accent="accent" />
        <StatCard icon={Eye} label="Total Views" value={stats.views.toLocaleString("id-ID")} accent="primary" />
        <StatCard icon={Activity} label="Engagement Rate" value={`${stats.engagementRate.toFixed(2)}%`} accent="success" />
        <StatCard icon={MessageSquare} label="Total Shares" value={stats.shares.toLocaleString("id-ID")} accent="accent" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-elegant lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">Distribusi Sentimen</h3>
              <p className="text-xs text-muted-foreground">Persentase per kelas</p>
            </div>
          </div>
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
              Belum ada data sentimen. Jalankan analisis dulu.
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-elegant lg:col-span-2">
          <h3 className="font-bold">Performa Engagement per Kampanye</h3>
          <p className="text-xs text-muted-foreground mb-4">Likes, views, & shares teragregasi</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="likes" stackId="a" fill="hsl(var(--accent))" radius={[0,0,0,0]} />
              <Bar dataKey="shares" stackId="a" fill="hsl(var(--success))" />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-elegant">
        <h3 className="font-bold">Tren Sentimen Berdasarkan Tanggal</h3>
        <p className="text-xs text-muted-foreground mb-4">Pergerakan harian distribusi sentimen</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <Legend />
            <Line type="monotone" dataKey="positif" stroke="hsl(var(--sentiment-positive))" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="negatif" stroke="hsl(var(--sentiment-negative))" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="netral" stroke="hsl(var(--sentiment-neutral))" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-gradient-to-br from-accent/10 to-transparent p-5 shadow-elegant">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white"><Lightbulb className="h-4 w-4" /></div>
            <h3 className="font-bold">Insight Utama Hari Ini</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-success/10 to-transparent p-5 shadow-elegant">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success text-white"><Sparkles className="h-4 w-4" /></div>
            <h3 className="font-bold">Rekomendasi Cepat</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
