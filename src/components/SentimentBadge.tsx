import { Sentiment } from "@/lib/types";

export const SentimentBadge = ({ s }: { s: Sentiment | "belum dianalisis" }) => {
  const map: Record<string, string> = {
    positif: "bg-success/10 text-success border-success/20",
    negatif: "bg-destructive/10 text-destructive border-destructive/20",
    netral: "bg-muted text-muted-foreground border-border",
    "belum dianalisis": "bg-warning/10 text-warning border-warning/20",
  };
  const label = s === "belum dianalisis" ? "Belum" : s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[s]}`}>
      {label}
    </span>
  );
};

export const EngagementBadge = ({ level }: { level?: string }) => {
  if (!level) return <span className="text-xs text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    Tinggi: "bg-accent/10 text-accent border-accent/20",
    Sedang: "bg-primary/10 text-primary border-primary/20",
    Rendah: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[level]}`}>
      {level}
    </span>
  );
};
