import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ChevronRight, Menu, Bell, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/input-data": "Input Data",
  "/analisis-sentimen": "Analisis Sentimen",
  "/data-komentar": "Data Komentar",
  "/hasil-klasifikasi": "Hasil Klasifikasi",
  "/evaluasi-model": "Evaluasi Model",
  "/testing": "Testing",
  "/laporan": "Laporan",
  "/pengaturan": "Pengaturan",
};

export const AppLayout = () => {
  const { user, isAuthReady } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  if (!isAuthReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  const title = routeNames[pathname] ?? "Dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </div>
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-md">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-gradient-primary px-4 lg:px-8 text-white shadow-elegant">
          <button className="lg:hidden rounded-md p-2 hover:bg-white/10" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60">Beranda</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/40" />
            <span className="font-semibold">{title}</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-md ml-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input placeholder="Cari komentar, campaign..." className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-accent" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="rounded-full p-2 hover:bg-white/10 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-[11px] text-white/60">{user.role}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">PT Vinix Seven Aurum • Social Media Sentiment Analysis</p>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
