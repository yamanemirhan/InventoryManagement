"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import {
  useCompany,
  useCompanyText,
} from "@/features/companies/company-provider";
import { useAuth } from "@/features/auth/components/auth-provider";
import { getAccessToken } from "@/features/auth/lib/keycloak";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";

type Notice = { id: string; companyId: string; createdAtUtc: string };
type State = {
  status: "connecting" | "connected" | "offline";
  notices: Notice[];
  unread: number;
  markRead: () => void;
  clear: () => void;
};
const Context = createContext<State | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { company, session } = useCompany();
  const auth = useAuth();
  if (auth.status !== "authenticated" || !company || !session)
    return <Context.Provider value={null}>{children}</Context.Provider>;
  return (
    <Connection
      key={session.subjectId + company.id + company.role}
      companyId={company.id}
    >
      {children}
    </Connection>
  );
}

function Connection({
  companyId,
  children,
}: {
  companyId: string;
  children: ReactNode;
}) {
  const cache = useQueryClient();
  const [status, setStatus] = useState<State["status"]>("connecting");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (base === undefined) return;
    let disposed = false;
    let denied = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let refresh: ReturnType<typeof setTimeout> | undefined;
    const seen = new Set<string>();
    const connection = new HubConnectionBuilder()
      .withUrl(
        base.replace(/\/$/, "") +
          "/api/realtime/workspace?companyId=" +
          encodeURIComponent(companyId),
        {
          accessTokenFactory: async () => (await getAccessToken()) ?? "",
          withCredentials: false,
        },
      )
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: () => 5000 + Math.random() * 5000,
      })
      .configureLogging(LogLevel.None)
      .build();
    const sync = () => {
      void cache.invalidateQueries();
    };
    connection.on("WorkspaceChanged", (event: Notice) => {
      if (
        disposed ||
        denied ||
        event.companyId !== companyId ||
        seen.has(event.id)
      )
        return;
      seen.add(event.id);
      if (seen.size > 500) seen.delete(seen.values().next().value!);
      setNotices((items) => [event, ...items].slice(0, 50));
      setUnread((value) => Math.min(value + 1, 50));
      // Coalesce bursts of committed changes into one refresh.
      if (!refresh)
        refresh = setTimeout(() => {
          refresh = undefined;
          sync();
        }, 300);
    });
    connection.on("AccessChanged", () => {
      denied = true;
      setStatus("offline");
      setNotices([]);
      setUnread(0);
      // Remove cached protected data before checking membership again.
      cache.removeQueries({
        predicate: (q) => q.queryKey[0] !== "company-session",
      });
      void cache.invalidateQueries({ queryKey: ["company-session"] });
      void connection.stop();
    });
    connection.onreconnecting(() => {
      if (!disposed) setStatus("connecting");
    });
    connection.onreconnected(() => {
      if (!disposed) {
        setStatus("connected");
        sync();
      }
    });
    async function start() {
      if (disposed || denied) return;
      clearTimeout(retry);
      try {
        await connection.start();
        if (disposed) {
          await connection.stop();
          return;
        }
        setStatus("connected");
        // Reconcile changes missed while disconnected; notifications are session-only.
        sync();
      } catch {
        if (!disposed && !denied) {
          setStatus("offline");
          clearTimeout(retry);
          retry = setTimeout(start, 10000);
        }
      }
    }
    connection.onclose(() => {
      if (!disposed && !denied) {
        setStatus("offline");
        clearTimeout(retry);
        retry = setTimeout(start, 10000);
      }
    });
    void start();
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearTimeout(refresh);
      void connection.stop();
    };
  }, [companyId, cache]);
  return (
    <Context.Provider
      value={{
        status,
        notices,
        unread,
        markRead: () => setUnread(0),
        clear: () => {
          setNotices([]);
          setUnread(0);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function NotificationCenter() {
  const state = useContext(Context);
  const t = useCompanyText();
  const { formatDate } = useI18n();
  const [open, setOpen] = useState(false);
  if (!state) return null;
  return (
    <div className="relative">
      <Button
        variant="ghost"
        aria-label={t("Bildirimler", "Notifications")}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          state.markRead();
        }}
      >
        <Bell size={19} />
        {state.unread > 0 && (
          <span className="rounded-full bg-brand px-1.5 text-xs text-on-brand">
            {state.unread}
          </span>
        )}
        <span
          className={
            state.status === "connected"
              ? "size-2 rounded-full bg-brand"
              : "size-2 rounded-full bg-muted"
          }
          title={
            state.status === "connected"
              ? t("Canlı bağlantı açık", "Live connection active")
              : t(
                  "Canlı bağlantı yeniden kuruluyor",
                  "Reconnecting live updates",
                )
          }
        />
      </Button>
      {open && (
        <section
          aria-label={t("Bildirimler", "Notifications")}
          className="absolute right-0 top-full z-50 mt-2 w-[min(340px,85vw)] rounded-xl border border-line bg-surface p-4 shadow-xl"
        >
          <header className="flex items-center justify-between">
            <h2 className="font-semibold">
              {t("Bildirimler", "Notifications")}
            </h2>
            <Button
              variant="ghost"
              aria-label={t("Kapat", "Close")}
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </Button>
          </header>
          <p className="mb-3 text-xs text-muted">
            {state.status === "connected"
              ? t(
                  "Canlı • bu oturumdaki son 50 bildirim",
                  "Live • latest 50 notifications in this session",
                )
              : t(
                  "Bağlantı kesildi. Ekranı yenileyerek devam edebilirsiniz.",
                  "Disconnected. You can refresh the page to continue.",
                )}
          </p>
          <div className="max-h-72 overflow-y-auto">
            {state.notices.length === 0 ? (
              <p className="py-4 text-sm text-muted">
                {t("Henüz bildirim yok.", "No notifications yet.")}
              </p>
            ) : (
              state.notices.map((n) => (
                <article key={n.id} className="border-t border-line py-3">
                  <p className="text-sm">
                    {t(
                      "Şirket verileri güncellendi.",
                      "Company data was updated.",
                    )}
                  </p>
                  <time
                    dateTime={n.createdAtUtc}
                    className="text-xs text-muted"
                  >
                    {formatDate(n.createdAtUtc)}
                  </time>
                </article>
              ))
            )}
          </div>
          {state.notices.length > 0 && (
            <Button variant="ghost" onClick={state.clear}>
              {t("Temizle", "Clear")}
            </Button>
          )}
        </section>
      )}
      <span role="status" className="sr-only">
        {state.unread > 0
          ? t("Yeni şirket bildirimi var.", "New company notification.")
          : ""}
      </span>
    </div>
  );
}
