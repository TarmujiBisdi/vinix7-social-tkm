import { useMemo } from "react";
import { summarizeAnalysis } from "@/lib/store";
import { useComments } from "@/hooks/useComments";
import { Gauge, Target, TrendingUp, Activity } from "lucide-react";

const EvaluasiModel = () => {
  const comments = useComments();
  const result = useMemo(() => summarizeAnalysis(comments), [comments]);

  const metrics = [
    { label: "Rata-rata Confidence", value: result.confidenceAvg, icon: Gauge, color: "text-primary bg-primary/10" },
    { label: "Cakupan Analisis", value: result.coverage, icon: Target, color: "text-success bg-success/10" },
    { label: "Dominasi Sentimen", value: result.consistency, icon: TrendingUp, color: "text-accent bg-accent/10" },
    { label: "Skor Kualitas", value: result.qualityScore, icon: Activity, color: "text-destructive bg-destructive/10" },
  ];

  const classes = ["Positif", "Negatif", "Netral"] as const;
  const rows = [
    { label: "Positif", count: result.positif },
    { label: "Negatif", count: result.negatif },
    { label: "Netral", count: result.netral },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-hero text-white p-6 lg:p-8 shadow-elevated">
        <h2 className="text-2xl lg:text-3xl font-bold">Evaluasi Kualitas Analisis</h2>
        <p className="text-white/70 mt-1">Ringkasan dihitung dari {result.total} komentar nyata yang tersimpan.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border bg-card p-5 shadow-elegant">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3">{m.label}</p>
            <p className="text-3xl font-bold mt-1 text-foreground">{(m.value * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <h3 className="font-bold mb-4">Ringkasan Hasil per Sentimen</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left text-muted-foreground">Sentimen</th>
                <th className="p-3 text-center font-semibold">Jumlah Komentar</th>
                <th className="p-3 text-center font-semibold">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="p-3 font-semibold">{row.label}</td>
                  <td className="p-3 text-center font-bold">{row.count}</td>
                  <td className="p-3 text-center text-muted-foreground">{result.total ? ((row.count / result.total) * 100).toFixed(1) : "0.0"}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">* Tidak menggunakan confusion matrix dummy karena belum ada label aktual/manual sebagai pembanding.</p>
      </div>
    </div>
  );
};

export default EvaluasiModel;
