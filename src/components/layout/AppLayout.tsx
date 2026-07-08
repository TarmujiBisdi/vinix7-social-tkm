import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ChevronRight, Menu, Bell, Search, X } from "lucide-react";

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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full glass-panel p-2 text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className="flex flex-1 flex-col min-w-0 p-4 lg:pl-0 gap-4">
        {/* Header bento */}
        <header className="glass-panel sticky top-4 z-30 flex h-20 items-center gap-4 rounded-[2rem] px-4 lg:px-8 text-white shadow-elegant">
          <button className="lg:hidden rounded-xl p-2 hover:bg-white/10 text-white" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <span className="text-white/30">Portal</span>
            <ChevronRight className="h-3 w-3 text-white/30" />
            <span className="text-white">{title}</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-sm ml-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              placeholder="Search insights..."
              className="w-full bg-[#1a1a2e]/80 border border-white/10 rounded-2xl py-3 pl-11 pr-6 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] transition-all"
            />
          </div>
          <div className="ml-auto flex items-center gap-3 lg:gap-4">
            <button className="relative p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#4ade80] border-2 border-[#16213e] rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/20 px-3 py-2 rounded-2xl">
              <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-[#4ade80] uppercase tracking-widest">Live</span>
            </div>
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-bold text-white">{user.name}</span>
              <span className="text-[10px] text-[#a78bfa] font-black uppercase tracking-wider">{user.role}</span>
            </div>
          </div>
        </header>

        {/* Main content bento */}
        <main className="flex-1 glass-panel rounded-[2.5rem] p-6 lg:p-10">
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-sm text-white/50 mt-2 font-medium">PT Vinix Seven Aurum · Social Media Sentiment Analysis</p>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
