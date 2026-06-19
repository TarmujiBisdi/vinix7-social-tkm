import { ReactNode } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export const StatCard = ({ icon: Icon, label, value, hint, accent = "primary", trend }: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "primary" | "success" | "destructive" | "muted" | "accent";
  trend?: number;
}) => {
  const accentMap = {
    primary: "from-primary/10 to-primary/5 text-primary",
    success: "from-success/15 to-success/5 text-success",
    destructive: "from-destructive/15 to-destructive/5 text-destructive",
    muted: "from-muted to-muted/40 text-muted-foreground",
    accent: "from-accent/15 to-accent/5 text-accent",
  };
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-elegant transition-all hover:shadow-elevated hover:-translate-y-0.5">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accentMap[accent]} opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          {trend !== undefined && (
            <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-success" : "text-destructive"}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}% vs minggu lalu
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
