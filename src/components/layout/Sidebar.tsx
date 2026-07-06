import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Upload, Brain, MessageSquare, Tags, FileText, Settings as SettingsIcon, LogOut, Gauge, FlaskConical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/vinix7-logo.png";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/input-data", label: "Input Data", icon: Upload },
  { to: "/analisis-sentimen", label: "Analisis Sentimen", icon: Brain },
  { to: "/data-komentar", label: "Data Komentar", icon: MessageSquare },
  { to: "/hasil-klasifikasi", label: "Hasil Klasifikasi", icon: Tags },
  { to: "/evaluasi-model", label: "Evaluasi Model", icon: Gauge },
  { to: "/testing", label: "Testing", icon: FlaskConical },
  { to: "/laporan", label: "Laporan", icon: FileText },
  { to: "/pengaturan", label: "Pengaturan", icon: SettingsIcon },
];

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const nav = useNavigate();
  const handleLogout = async () => { await logout(); nav("/login"); };

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-accent shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-white">Vinix Seven Aurum</span>
          <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Sentiment Suite</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Menu Utama</p>
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent text-sm font-semibold text-white">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name ?? "Guest"}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
};
