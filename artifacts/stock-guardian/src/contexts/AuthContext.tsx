import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { simularLogin } from "@/services/api";

export type Role = "admin" | "operador" | "viewer";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOperador: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("sg_token");
    const storedUser = localStorage.getItem("sg_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("sg_token");
        localStorage.removeItem("sg_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const { token: newToken, user: newUser } = await simularLogin(email, senha);
    localStorage.setItem("sg_token", newToken);
    localStorage.setItem("sg_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser as AuthUser);
  };

  const logout = () => {
    localStorage.removeItem("sg_token");
    localStorage.removeItem("sg_user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const isOperador = user?.role === "operador";
  const canEdit = isAdmin || isOperador;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin, isOperador, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
