import { useMemo } from "react";
import { useComments, useSettings } from "@/hooks/useComments";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, AlertTriangle, Award, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const Reports = () => {
  const comments = useComments();
  const settings = useSettings();

  const stats = useMemo(() => {
    const positif = comments.filter(c=>c.sentiment_status==="positif").length;
    const negatif = comments.filter(c=>c.sentiment_status==="negatif").length;
    const netral = comments.filter(c=>c.sentiment_status==="netral").length;
    const dates = comments.map(c=>c.post_date).sort();
    const period = dates.length ? `${dates[0]} s/d ${dates[dates.length-1]}` : "-";

    const byCampaign = new Map<string, { name: string; engagement: number; negatives: number }>();
    for (const c of comments) {
      const prev = byCampaign.get(c.campaign_name) ?? { name: c.campaign_name, engagement: 0, negatives: 0 };
      prev.engagement += c.likes + c.shares*3 + c.views*0.1;
      if (c.sentiment_status === "negatif") prev.negatives++;
      byCampaign.set(c.campaign_name, prev);
    }
    const campaigns = [...byCampaign.values()];
    const top = [...campaigns].sort((a,b)=>b.engagement-a.engagement)[0];
    const worst = [...campaigns].sort((a,b)=>b.negatives-a.negatives)[0];
    return { positif, negatif, netral, total: comments.length, period, top, worst, campaigns };
  }, [comments]);

  const recommendation = useMemo(() => {
    const recs: string[] = [];
    if (stats.positif > stats.negatif + stats.netral) recs.push("Tingkatkan frekuensi konten serupa untuk mempertahankan momentum positif & optimalkan call-to-action.");
    if (stats.negatif >= stats.positif) recs.push("Lakukan evaluasi pesan konten yang menerima komentar negatif & respon cepat keluhan audiens.");
    if (stats.netral >= stats.positif && stats.netral >= stats.negatif) recs.push("Perkuat storytelling, gunakan visual lebih menarik, dan tambahkan CTA untuk meningkatkan interaksi.");
    if (stats.top) recs.push(`Replikasi format kampanye "${stats.top.name}" yang memiliki engagement tertinggi.`);
    if (stats.worst && stats.worst.negatives > 0) recs.push(`Evaluasi kampanye "${stats.worst.name}" yang menerima komentar negatif terbanyak.`);
    return recs;
  }, [stats]);

  const pie = [
    { name: "Positif", value: stats.positif, color: "hsl(var(--sentiment-positive))" },
    { name: "Negatif", value: stats.negatif, color: "hsl(var(--sentiment-negative))" },
    { name: "Netral", value: stats.netral, color: "hsl(var(--sentiment-neutral))" },
  ].filter(d => d.value > 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(11,31,58); doc.rect(0,0,210,30,"F");
    doc.setTextColor(255); doc.setFontSize(14);
    doc.text("Laporan Analisis Sentimen Media Sosial", 14, 14);
    doc.setFontSize(10); doc.text(settings.company_name, 14, 22);
    doc.setTextColor(0); doc.setFontSize(11);
    doc.text(`Periode Analisis: ${stats.period}`, 14, 42);
    doc.text(`Total Komentar: ${stats.total}`, 14, 50);

    autoTable(doc, {
      startY: 58,
      head: [["Sentimen","Jumlah","Persentase"]],
      body: [
        ["Positif", stats.positif, `${stats.total ? ((stats.positif/stats.total)*100).toFixed(1) : 0}%`],
        ["Negatif", stats.negatif, `${stats.total ? ((stats.negatif/stats.total)*100).toFixed(1) : 0}%`],
        ["Netral", stats.netral, `${stats.total ? ((stats.netral/stats.total)*100).toFixed(1) : 0}%`],
      ],
      headStyles: { fillColor: [11,31,58] },
    });

    const y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.text("Rekomendasi Strategi", 14, y);
    doc.setFontSize(10);
    recommendation.forEach((r,i) => doc.text(`${i+1}. ${r}`, 14, y + 8 + i*7, { maxWidth: 180 }));

    doc.save("laporan-sentimen-vinix.pdf");
    toast.success("Laporan PDF diunduh");
  };

  return (
    <div className="space-y-6" id="report-content">
      <div className="rounded-2xl bg-gradient-hero text-white p-8 shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, hsl(262 83% 58% / .6), transparent 50%)" }} />
        <div className="relative flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Laporan Resmi</p>
            <h2 className="text-2xl md:text-3xl font-bold mt-1">Laporan Analisis Sentimen Media Sosial</h2>
            <p className="text-white/80 mt-1">{settings.company_name}</p>
            <p className="text-sm text-white/60 flex items-center gap-2 mt-3"><Calendar className="h-4 w-4" /> Periode: {stats.period}</p>
          </div>
          <Button onClick={exportPDF} size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Komentar", value: stats.total, icon: FileText, c: "primary" },
          { label: "Positif", value: stats.positif, icon: TrendingUp, c: "success" },
          { label: "Negatif", value: stats.negatif, icon: AlertTriangle, c: "destructive" },
          { label: "Netral", value: stats.netral, icon: FileText, c: "muted" },
        ].map((s:any) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-elegant">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <h3 className="font-bold mb-3">Distribusi Sentimen</h3>
          {pie.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value">
                  {pie.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-10 text-center">Belum ada data sentimen.</p>}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <h3 className="font-bold mb-3">Engagement per Kampanye</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.campaigns}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="engagement" fill="hsl(var(--accent))" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-gradient-to-br from-success/10 to-transparent p-5 shadow-elegant">
          <div className="flex items-center gap-2 mb-2"><Award className="h-5 w-5 text-success" /><h3 className="font-bold">Konten Engagement Tertinggi</h3></div>
          {stats.top ? <p className="text-2xl font-bold mt-2">{stats.top.name}</p> : <p className="text-sm text-muted-foreground">-</p>}
          {stats.top && <p className="text-sm text-muted-foreground mt-1">Skor engagement: {stats.top.engagement.toFixed(0)}</p>}
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-destructive/10 to-transparent p-5 shadow-elegant">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-5 w-5 text-destructive" /><h3 className="font-bold">Komentar Negatif Terbanyak</h3></div>
          {stats.worst ? <p className="text-2xl font-bold mt-2">{stats.worst.name}</p> : <p className="text-sm text-muted-foreground">-</p>}
          {stats.worst && <p className="text-sm text-muted-foreground mt-1">{stats.worst.negatives} komentar negatif</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <h3 className="font-bold text-lg mb-3">Rekomendasi Strategi Digital Marketing</h3>
        <ol className="space-y-3">
          {recommendation.map((r,i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-accent text-white text-xs font-bold">{i+1}</span>
              <p className="text-sm leading-relaxed pt-0.5">{r}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Reports;
