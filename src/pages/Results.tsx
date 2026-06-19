import { useMemo, useState } from "react";
import { useComments } from "@/hooks/useComments";
import { SentimentBadge, EngagementBadge } from "@/components/SentimentBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, FileText, Tags } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const Results = () => {
  const comments = useComments();
  const [filter, setFilter] = useState("all");

  const analyzed = useMemo(() => comments.filter(c => c.sentiment_status !== "belum dianalisis"), [comments]);
  const filtered = useMemo(() => filter === "all" ? analyzed : analyzed.filter(c => c.sentiment_status === filter), [analyzed, filter]);

  const exportCSV = () => {
    const rows = filtered.map(c => ({
      komentar: c.comment_text,
      sentimen: c.sentiment_status,
      confidence: c.confidence_score,
      likes: c.likes, views: c.views, shares: c.shares,
      engagement_level: c.engagement_level,
      rekomendasi: c.recommendation,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hasil-klasifikasi.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV diekspor");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Hasil Klasifikasi Sentimen - PT Vinix Seven Aurum", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["Komentar","Sentimen","Score","Likes","Views","Engagement","Rekomendasi"]],
      body: filtered.map(c => [
        c.comment_text.slice(0,60),
        c.sentiment_status,
        c.confidence_score?.toString() ?? "-",
        c.likes, c.views,
        c.engagement_level ?? "-",
        (c.recommendation ?? "").slice(0,50),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [11, 31, 58] },
    });
    doc.save("hasil-klasifikasi.pdf");
    toast.success("PDF diekspor");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-elegant flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1">
          <h3 className="font-bold">Filter & Ekspor</h3>
          <p className="text-sm text-muted-foreground">{analyzed.length} komentar telah dianalisis</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sentimen</SelectItem>
            <SelectItem value="positif">Positif</SelectItem>
            <SelectItem value="negatif">Negatif</SelectItem>
            <SelectItem value="netral">Netral</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> CSV</Button>
        <Button onClick={exportPDF} className="bg-gradient-primary text-white"><FileText className="h-4 w-4 mr-2" /> PDF</Button>
      </div>

      <div className="rounded-xl border bg-card shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Komentar</th>
                <th className="px-4 py-3 text-left">Sentimen</th>
                <th className="px-4 py-3 text-right">Confidence</th>
                <th className="px-4 py-3 text-right">Likes</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-left">Engagement</th>
                <th className="px-4 py-3 text-left">Rekomendasi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                  <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Belum ada hasil. Jalankan analisis terlebih dahulu.
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-secondary/30 align-top">
                  <td className="px-4 py-3 max-w-sm">{c.comment_text}</td>
                  <td className="px-4 py-3"><SentimentBadge s={c.sentiment_status} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-gradient-accent" style={{ width: `${(c.confidence_score ?? 0)*100}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{((c.confidence_score ?? 0)*100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.likes.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.views.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3"><EngagementBadge level={c.engagement_level} /></td>
                  <td className="px-4 py-3 max-w-sm text-muted-foreground text-xs leading-relaxed">{c.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Results;
