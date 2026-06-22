import { useState } from "react";
import { classifyComment } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SentimentBadge } from "@/components/SentimentBadge";
import { FlaskConical, Sparkles } from "lucide-react";

const Testing = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ sentiment: string; confidence: number } | null>(null);
  const [history, setHistory] = useState<{ text: string; sentiment: string; confidence: number }[]>([]);

  const run = () => {
    if (!text.trim()) return;
    const r = classifyComment(text);
    setResult(r);
    setHistory((h) => [{ text, ...r }, ...h].slice(0, 10));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-hero text-white p-6 lg:p-8 shadow-elevated">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs mb-3 backdrop-blur-sm">
          <FlaskConical className="h-3 w-3" /> Live Testing
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold">Uji Klasifikasi Sentimen</h2>
        <p className="text-white/70 mt-1 max-w-xl">Masukkan teks komentar untuk diklasifikasikan secara real-time menggunakan model Naive Bayes.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant space-y-4">
        <Textarea
          placeholder="Tulis komentar di sini, contoh: 'Produknya bagus banget, saya suka!'"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        <Button onClick={run} className="bg-gradient-primary text-white">
          <Sparkles className="h-4 w-4 mr-2" /> Klasifikasikan
        </Button>

        {result && (
          <div className="rounded-lg border bg-secondary/40 p-4 animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hasil Prediksi</p>
            <div className="flex items-center gap-3">
              <SentimentBadge sentiment={result.sentiment as any} />
              <span className="text-sm text-muted-foreground">Confidence: <span className="font-bold text-foreground">{(result.confidence * 100).toFixed(1)}%</span></span>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-elegant">
          <h3 className="font-bold mb-4">Riwayat Pengujian</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <p className="text-sm flex-1">{h.text}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <SentimentBadge sentiment={h.sentiment as any} />
                  <span className="text-xs text-muted-foreground">{(h.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Testing;
