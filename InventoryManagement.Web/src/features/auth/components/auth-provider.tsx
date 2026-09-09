"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type Keycloak from "keycloak-js";
import type { AuthConfig } from "../types/auth";
import { initializeAuth, safeReturnPath, sessionEvent } from "../lib/keycloak";
import { useI18n } from "@/lib/i18n/provider";
import { useAppDispatch } from "@/store/hooks";
import { setSelectedWarehouseId } from "@/store/slices/inventory-ui-slice";

type AuthState = {
  status: "loading" | "authenticated" | "anonymous" | "error" | "configuration";
  client?: Keycloak;
  admin: boolean;
  user: boolean;
  name: string;
};
type AuthContextValue = AuthState & {
  googleEnabled: boolean;
  login: (google?: boolean) => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  account: () => Promise<void>;
};
const Context = createContext<AuthContextValue | null>(null);
export function AuthProvider({
  config,
  children,
}: {
  config: AuthConfig | null;
  children: ReactNode;
}) {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const [state, setState] = useState<AuthState>({
    status: config ? "loading" : "configuration",
    admin: false,
    user: false,
    name: "",
  });
  useEffect(() => {
    if (!config) return;
    let active = true;
    let instance: Keycloak | undefined;
    const update = () => {
      if (!active || !instance) return;
      if (!instance.authenticated) {
        queryClient.clear();
        dispatch(setSelectedWarehouseId(null));
      }
      setState({
        client: instance,
        status: instance.authenticated ? "authenticated" : "anonymous",
        admin: instance.hasRealmRole("Admin"),
        user: instance.hasRealmRole("User"),
        name: String(
          instance.tokenParsed?.name ??
            instance.tokenParsed?.preferred_username ??
            "",
        ),
      });
    };
    window.addEventListener(sessionEvent, update);
    void initializeAuth(config)
      .then((value) => {
        instance = value;
        update();
      })
      .catch(() => {
        if (active)
          setState({ status: "error", admin: false, user: false, name: "" });
      });
    return () => {
      active = false;
      window.removeEventListener(sessionEvent, update);
    };
  }, [config, dispatch, queryClient]);
  const beforeLogin = () => {
    const path = safeReturnPath(location.pathname + location.search);
    if (!location.pathname.startsWith("/auth"))
      sessionStorage.setItem("inventory-return", path);
  };
  const value: AuthContextValue = {
    ...state,
    googleEnabled: config?.googleEnabled ?? false,
    login: async (google = false) => {
      beforeLogin();
      await state.client?.login({
        locale,
        idpHint: google ? "google" : undefined,
        redirectUri: location.origin + "/auth/callback",
      });
    },
    register: async () => {
      beforeLogin();
      await state.client?.register({
        locale,
        redirectUri: location.origin + "/auth/callback",
      });
    },
    logout: async () => {
      queryClient.clear();
      dispatch(setSelectedWarehouseId(null));
      await state.client?.logout({
        redirectUri: location.origin + "/auth/login",
      });
    },
    account: async () => {
      await state.client?.accountManagement();
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
