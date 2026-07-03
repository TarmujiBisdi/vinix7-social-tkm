import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAuthReady: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

async function resolveRole(userId: string): Promise<"Admin" | "Stakeholder"> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (roles.includes("admin")) return "Admin";
  return "Stakeholder";
}

function buildUser(session: Session | null, role: "Admin" | "Stakeholder"): User | null {
  if (!session?.user) return null;
  const email = session.user.email ?? "";
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const name = (typeof meta.full_name === "string" && meta.full_name) || email.split("@")[0] || "User";
  return { name, email, role };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Subscribe first, then read existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next?.user) {
        setUser(null);
        return;
      }
      // Defer role fetch to avoid deadlock inside the callback
      setTimeout(async () => {
        const role = await resolveRole(next.user!.id);
        setUser(buildUser(next, role));
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      setSession(existing);
      if (existing?.user) {
        const role = await resolveRole(existing.user.id);
        setUser(buildUser(existing, role));
      }
      setIsAuthReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signup = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, session, isAuthReady, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
