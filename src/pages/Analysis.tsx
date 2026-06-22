import { useState } from "react";
import { runAnalysisAll } from "@/lib/store";
import { useComments } from "@/hooks/useComments";
import { Button } from "@/components/ui/button";
import { Brain, Check, Loader2, Sparkles, Play, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const steps = [
  { key: "cleaning", label: "Cleaning", desc: "Membersihkan tanda baca, angka, dan karakter spesial." },
  { key: "tokenizing", label: "Tokenizing", desc: "Memecah kalimat menjadi token kata." },
  { key: "stopword", label: "Stopword Removal", desc: "Menghapus kata umum yang tidak bermakna." },
  { key: "stemming", label: "Stemming", desc: "Mengubah kata ke bentuk dasar." },
  { key: "tfidf", label: "TF-IDF", desc: "Pembobotan term frequency-inverse document frequency." },
  { key: "naive", label: "Klasifikasi Naive Bayes", desc: "Klasifikasi sentimen positif / negatif / netral." },
];

const Analysis = () => {
  const comments = useComments();
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const nav = useNavigate();

  const run = async () => {
    if (comments.length === 0) { toast.error("Belum ada data komentar."); return; }
    setRunning(true); setResult(null);
    for (let i = 0; i < steps.length; i++) {
      setActive(i);
      await new Promise(r => setTimeout(r, 600));
    }
    const r = runAnalysisAll();
    setResult(r);
    setRunning(false);
    setActive(steps.length);
    toast.success("Analisis selesai");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-hero text-white p-6 lg:p-8 shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 90% 30%, hsl(262 83% 58% / .7), transparent 50%)" }} />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs mb-3 backdrop-blur-sm">
              <Brain className="h-3 w-3" /> Naive Bayes Pipeline
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold">Analisis Sentimen Otomatis</h2>
            <p className="text-white/70 mt-1 max-w-xl">Jalankan pipeline preprocessing & klasifikasi pada {comments.length} komentar.</p>
          </div>
          <Button onClick={run} disabled={running} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow">
            {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</> : <><Play className="h-4 w-4 mr-2" /> Jalankan Analisis</>}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <h3 className="font-bold mb-1">Tahapan Proses</h3>
        <p className="text-sm text-muted-foreground mb-6">Setiap komentar melalui pipeline berikut sebelum diklasifikasikan.</p>
        <ol className="relative space-y-4">
          {steps.map((s, i) => {
            const done = active > i || (active === steps.length);
            const current = active === i && running;
            return (
              <li key={s.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    done ? "bg-success border-success text-white" :
                    current ? "border-accent text-accent animate-pulse" :
                    "border-border text-muted-foreground"
                  }`}>
                    {done ? <Check className="h-4 w-4" /> : current ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-sm font-bold">{i+1}</span>}
                  </div>
                  {i < steps.length - 1 && <div className={`w-0.5 flex-1 mt-1 ${done ? "bg-success" : "bg-border"}`} style={{ minHeight: 24 }} />}
                </div>
                <div className="pb-4 flex-1">
                  <p className={`font-semibold ${current ? "text-accent" : done ? "text-success" : "text-foreground"}`}>{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {result && (
        <div className="rounded-xl border bg-card p-6 shadow-elegant animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-lg">Ringkasan Hasil Analisis</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Positif", value: result.positif, color: "text-success bg-success/10" },
              { label: "Negatif", value: result.negatif, color: "text-destructive bg-destructive/10" },
              { label: "Netral", value: result.netral, color: "text-muted-foreground bg-muted" },
              { label: "Total", value: result.total, color: "text-primary bg-primary/10" },
            ].map(r => (
              <div key={r.label} className={`rounded-lg p-4 ${r.color}`}>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{r.label}</p>
                <p className="text-3xl font-bold mt-1">{r.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Akurasi", value: `${(result.accuracy*100).toFixed(1)}%` },
              { label: "Precision", value: `${(result.precision*100).toFixed(1)}%` },
              { label: "Recall", value: `${(result.recall*100).toFixed(1)}%` },
              { label: "F1-Score", value: `${(result.f1*100).toFixed(1)}%` },
            ].map(m => (
              <div key={m.label} className="rounded-lg border bg-secondary/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold mt-1 text-primary">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">* Metrik akurasi, precision, recall & F1 ditampilkan sebagai simulasi representasi model Naive Bayes pada prototype ini.</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button onClick={() => nav("/hasil-klasifikasi")} className="bg-gradient-primary text-white">
              Lihat Hasil Klasifikasi <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => nav("/laporan")}>Buka Laporan</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
