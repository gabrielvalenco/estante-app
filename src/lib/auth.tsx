import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { api, configureApi } from "@/lib/api";
import type { Account } from "@/lib/types";

/**
 * Login do app. O token fica no SecureStore (Keychain no iPhone, Keystore no Android), nunca em
 * AsyncStorage. Na versão web de desenvolvimento, que não tem SecureStore, usa o localStorage.
 */
const KEY = "estante.token";

const storage = {
  get: () => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.getItem(KEY) ?? null) : SecureStore.getItemAsync(KEY)),
  set: (v: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.setItem(KEY, v)) : SecureStore.setItemAsync(KEY, v)),
  clear: () => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.removeItem(KEY)) : SecureStore.deleteItemAsync(KEY)),
};

type AuthValue = {
  /** "loading" só enquanto o token é lido do armazenamento na abertura do app. */
  status: "loading" | "guest" | "user";
  account: Account | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Atualiza a conta em cache (depois de editar perfil, foto, estante). */
  setAccount: (next: Account | ((prev: Account) => Account)) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  const signOut = useCallback(async () => {
    await storage.clear();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  // O cliente da API precisa do token antes da primeira consulta.
  configureApi({ token: token ?? null, onUnauthorized: () => void signOut() });

  useEffect(() => {
    storage.get().then((t) => setToken(t ?? null), () => setToken(null));
  }, []);

  const me = useQuery({
    queryKey: ["me", token],
    queryFn: () => api<Account>("/me"),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const start = useCallback(
    async (result: { token: string; account: Account }) => {
      await storage.set(result.token);
      queryClient.setQueryData(["me", result.token], result.account);
      setToken(result.token);
    },
    [queryClient],
  );

  const value = useMemo<AuthValue>(
    () => ({
      status: token === undefined || (token && me.isPending) ? "loading" : token && me.data ? "user" : "guest",
      account: me.data ?? null,
      signIn: async (email, password) =>
        start(await api<{ token: string; account: Account }>("/auth/login", { method: "POST", body: { email, password }, auth: false })),
      signUp: async (name, email, password) =>
        start(await api<{ token: string; account: Account }>("/auth/signup", { method: "POST", body: { name, email, password }, auth: false })),
      signOut,
      setAccount: (next) =>
        queryClient.setQueryData<Account>(["me", token], (prev) => (prev ? (typeof next === "function" ? next(prev) : next) : prev)),
    }),
    [token, me.isPending, me.data, start, signOut, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
