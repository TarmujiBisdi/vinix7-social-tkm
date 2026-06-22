import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUser, setUser as persistUser, clearUser } from "@/lib/store";
import { User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  isAuthReady: boolean;
  login: (email: string, password: string, role: "Admin" | "Stakeholder") => boolean;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    setUserState(getUser());
    setIsAuthReady(true);
  }, []);

  const login = (email: string, _password: string, role: "Admin" | "Stakeholder") => {
    if (!email) return false;
    const u: User = { name: role === "Admin" ? "Admin VSA" : "Stakeholder VSA", email, role };
    persistUser(u); setUserState(u); return true;
  };
  const logout = () => { clearUser(); setUserState(null); };
  return <Ctx.Provider value={{ user, isAuthReady, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
