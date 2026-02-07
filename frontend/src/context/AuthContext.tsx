"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "@/services/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: "doctor" | "patient" | "pharmacist" | "admin";
  fullName: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ riskScore: number; requiresStepUp: boolean }>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate user from localStorage
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    // The API returns { user, accessToken, riskScore, requiresStepUp, passwordExpired }
    const {
      user: userData,
      accessToken,
      riskScore,
      requiresStepUp,
      passwordExpired,
    } = response.data;

    if (passwordExpired) {
      router.push("/auth/change-password");
    } else {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }

    return { riskScore, requiresStepUp };
  };

  const register = async (data: any) => {
    const response = await authAPI.register(data);
    return response.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Logout even if API fails
      console.error("Logout API failed", e);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
