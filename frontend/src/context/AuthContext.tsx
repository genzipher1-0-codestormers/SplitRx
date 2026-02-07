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
  ) => Promise<{
    riskScore: number;
    requiresStepUp: boolean;
    passwordExpired: boolean;
  }>;
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
    // Check session validity and freshness on mount
    const checkSession = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          // Determine API URL based on environment or default
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);

            if (data.user.passwordExpired) {
              router.push("/auth/change-password");
            }
          } else {
            // Token invalid or expired
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            setUser(null);
          }
        } catch (e) {
          console.error("Session check failed", e);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      // The API returns { user, accessToken, riskScore, requiresStepUp, passwordExpired }
      const {
        user: userData,
        accessToken,
        riskScore,
        requiresStepUp,
        passwordExpired,
      } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      if (passwordExpired) {
        router.push("/auth/change-password");
      }

      return { riskScore, requiresStepUp, passwordExpired };
    } finally {
      setLoading(false);
    }
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
