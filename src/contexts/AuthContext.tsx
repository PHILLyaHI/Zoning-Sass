"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  User, 
  getCurrentUser, 
  loginUser, 
  signupUser, 
  logoutUser,
  upgradeToPro,
  hasActiveSubscription,
  getTrialDaysRemaining
} from "../lib/auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSubscription: boolean;
  trialDaysRemaining: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  upgrade: () => Promise<{ success: boolean }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const result = loginUser(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const signup = async (email: string, password: string) => {
    const result = signupUser(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const upgrade = async () => {
    const result = upgradeToPro();
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success };
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    hasSubscription: hasActiveSubscription(),
    trialDaysRemaining: getTrialDaysRemaining(),
    login,
    signup,
    logout,
    upgrade,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}



