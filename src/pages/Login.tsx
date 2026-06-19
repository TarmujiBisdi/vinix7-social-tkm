import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Login = () => {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@vinixsevenaurum.co.id");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<"Admin" | "Stakeholder">("Admin");

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password, role)) {
      toast.success(`Selamat datang, ${role}!`);
      nav("/dashboard");
    } else toast.error("Email tidak valid");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Branding side */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-hero p-12 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, hsl(262 83% 58% / .6), transparent 40%), radial-gradient(circle at 80% 80%, hsl(217 100% 50% / .4), transparent 40%)"
        }} />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm shadow-glow">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold">PT Vinix Seven Aurum</p>
            <p className="text-xs text-white/60 uppercase tracking-widest">Sentiment Suite</p>
          </div>
        </div>
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> Naive Bayes Classifier · v1.0
          </div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Pahami suara<br />audiens Anda<br />
            <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">secara real-time.</span>
          </h2>
          <p className="text-lg text-white/70 max-w-md">
            Dashboard analisis sentimen media sosial untuk mendukung strategi digital marketing berbasis data.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4 text-sm">
          {[
            { k: "5+", v: "Platform" },
            { k: "Naive", v: "Bayes" },
            { k: "Real-time", v: "Insight" },
          ].map(s => (
            <div key={s.v} className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold text-accent">{s.k}</p>
              <p className="text-xs text-white/60">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-accent">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <p className="font-bold">PT Vinix Seven Aurum</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Masuk ke Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Gunakan akun Anda untuk melanjutkan ke ruang kerja.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-secondary p-1">
              {(["Admin","Stakeholder"] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-all ${role===r ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="pwd" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="pl-9" required />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 text-white shadow-glow">
              Masuk Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="rounded-lg border border-dashed bg-secondary/50 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Demo Login</p>
              Email apa saja yang valid + password apa saja. Pilih role di atas untuk login sebagai Admin atau Stakeholder.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
