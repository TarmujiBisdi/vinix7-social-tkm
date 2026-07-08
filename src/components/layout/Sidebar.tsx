import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Upload, Brain, MessageSquare, Tags, FileText, Settings as SettingsIcon, LogOut, Gauge, FlaskConical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
    <aside className="flex h-full w-72 flex-col gap-4 p-4">
      {/* Logo module */}
      <div className="glass-panel rounded-[2rem] p-5 flex items-center gap-4">
        <div className="relative">
          <div className="w-11 h-11 bg-gradient-to-tr from-[#a78bfa] to-[#4ade80] rounded-2xl rotate-6 absolute -inset-0.5 blur-sm opacity-60" />
          <div className="relative w-11 h-11 bg-[#1a1a2e] border border-white/20 rounded-2xl flex items-center justify-center text-[#4ade80] font-display font-extrabold text-xl">
            V
          </div>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-white font-display font-extrabold text-lg tracking-tight">Vinix7</span>
          <span className="text-[10px] text-[#a78bfa] font-bold uppercase tracking-[0.2em] mt-1">Analis Sentimen</span>
        </div>
      </div>

      {/* Nav module */}
      <nav className="glass-panel flex-1 rounded-[2rem] p-3 flex flex-col overflow-y-auto scrollbar-hide">
        <p className="px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.25em]">Dashboard Explorer</p>
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onNavigate}
                  className={`flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300 group ${
                    active
                      ? "bg-gradient-to-r from-[#a78bfa]/25 to-transparent border-l-4 border-[#a78bfa] text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${active ? "text-[#a78bfa]" : "group-hover:text-[#4ade80]"}`} />
                  <span className={`text-sm ${active ? "font-bold tracking-wide" : "font-medium"}`}>{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User module */}
      <div className="glass-panel rounded-[2rem] p-4 flex flex-col gap-3 shadow-elevated">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#a78bfa] to-[#4ade80] p-[2px]">
            <div className="w-full h-full rounded-[14px] bg-[#1a1a2e] flex items-center justify-center text-white font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-bold text-white leading-tight">{user?.name ?? "Guest"}</p>
            <p className="truncate text-[10px] text-[#4ade80] font-black uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-black uppercase tracking-widest transition-all"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
};
