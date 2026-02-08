import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, API_URL } from "../api";

export type User = {
  id: string;
  discordId: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
  siteAdmin: boolean;
};

type AuthState = {
  user: User | null;
  permissions: string[];
  roleIds: string[];
  isMember: boolean;
  allowMembersList: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  login: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [isMember, setIsMember] = useState<boolean>(true);
  const [allowMembersList, setAllowMembersList] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadMe() {
    setLoading(true);
    try {
      const response = await apiFetch("/me");
      if (!response.ok) {
        setUser(null);
        setPermissions([]);
        setRoleIds([]);
        setIsMember(true);
        setAllowMembersList(false);
        return;
      }
      const data = await response.json();
      setUser(data.user);
      setPermissions(data.permissions ?? []);
      setRoleIds(data.roleIds ?? []);
      setIsMember(data.isMember ?? true);
      setAllowMembersList(data.allowMembersList ?? false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function refresh() {
    const response = await apiFetch("/me/refresh", { method: "POST" });
    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        setPermissions([]);
        setRoleIds([]);
        setIsMember(true);
        setAllowMembersList(false);
      }
      if (response.status === 403) {
        const data = await response.json().catch(() => null);
        setIsMember(data?.isMember ?? false);
        setAllowMembersList(data?.allowMembersList ?? false);
      }
      return;
    }
    const data = await response.json();
    setUser(data.user);
    setPermissions(data.permissions ?? []);
    setRoleIds(data.roleIds ?? []);
    setIsMember(data.isMember ?? true);
    setAllowMembersList(data.allowMembersList ?? false);
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
    setPermissions([]);
    setRoleIds([]);
    setIsMember(true);
    setAllowMembersList(false);
  }

  function login() {
    window.location.href = `${API_URL}/auth/discord/login`;
  }

  const value = useMemo(
    () => ({
      user,
      permissions,
      roleIds,
      isMember,
      allowMembersList,
      loading,
      refresh,
      logout,
      login
    }),
    [user, permissions, roleIds, isMember, allowMembersList, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
