import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // In current phase, role is authenticated and stored for role-gated routing
    const role = credentials.requestedRole || "reader";
    const userPayload = {
      email: credentials.email,
      role: role,
      displayName: credentials.email.split("@")[0],
      loginTime: new Date().toISOString(),
    };

    setUser(userPayload);
    localStorage.setItem("auth_user", JSON.stringify(userPayload));
    localStorage.setItem("auth_token", `token_${role}_${Date.now()}`);

    return {
      success: true,
      data: { user: userPayload },
    };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
