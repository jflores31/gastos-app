import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { useSupabaseUser } from "@/contexts/UserContext";
import { signOut } from "../data/authApi";
import type { ShowToast } from "@/components/feedback/useToast";

const SESSION_ALIVE_KEY = "gastos_session_alive";
const LAST_ACTIVE_KEY = "gastos_last_active";
const SESSION_CHANNEL = "gastos-session";

// Session security of the app shell: redirect without a user, sign out after
// `idleMinutes` of inactivity (with a warning toast), after 8 h, or when the browser
// was reopened. Returns the manual sign-out of the header button.
export function useSessionGuard(showToast: ShowToast) {
  const { t, idleMinutes } = useSettings();
  const user = useSupabaseUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem(LAST_ACTIVE_KEY);
    await signOut();
    router.replace("/login");
  }, [router]);

  // Automatic logouts (inactivity, 8h max age, reopened browser) only end the session
  // in this browser. signOut()'s default scope is "global", which would also revoke the
  // user's sessions on every other device.
  const autoSignOut = useCallback(async () => {
    localStorage.removeItem(LAST_ACTIVE_KEY);
    await signOut({ scope: "local" });
    router.replace("/login");
  }, [router]);

  // Redirect unauthenticated users (belt-and-suspenders backup to middleware)
  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    }
  }, [user, router]);

  // Inactivity auto-logout after `idleMinutes` (Ajustes, 2 by default) with a 30s warning.
  // LAST_ACTIVE_KEY lives in localStorage, shared by every tab: before warning or
  // logging out, re-read it so an idle tab doesn't end a session the user is
  // actively using in another tab.
  useEffect(() => {
    if (!user) return;

    const TIMEOUT = idleMinutes * 60_000;
    const WARN_BEFORE = 30_000;

    let logoutTimer: ReturnType<typeof setTimeout> | undefined;
    let warnTimer: ReturnType<typeof setTimeout> | undefined;

    const msLeft = () => {
      const last = Number(localStorage.getItem(LAST_ACTIVE_KEY)) || Date.now();
      return TIMEOUT - (Date.now() - last);
    };

    const schedule = () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      const left = msLeft();
      if (left <= 0) {
        autoSignOut();
        return;
      }
      if (left > WARN_BEFORE) warnTimer = setTimeout(warn, left - WARN_BEFORE);
      logoutTimer = setTimeout(schedule, left);
    };

    const warn = () => {
      // Activity in another tab pushed the deadline back: reschedule instead.
      if (msLeft() > WARN_BEFORE + 1000) {
        schedule();
        return;
      }
      showToast(t.dashboard.sessionClosingSoon, "warning", WARN_BEFORE);
    };

    const resetTimers = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      schedule();
    };

    const EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      clearTimeout(logoutTimer);
      clearTimeout(warnTimer);
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [user, showToast, t, autoSignOut, idleMinutes]);

  // Session security: force login on browser close (sessionStorage flag) + 8h max-age for open tabs.
  // sessionStorage is per tab, so a tab opened by hand (bookmark, typed URL) starts without
  // the flag even while other tabs are open. Before treating that as a reopened browser,
  // ask the other tabs over a BroadcastChannel; if one answers, inherit its flag.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SESSION_CHANNEL);
      const ch = channel;
      ch.onmessage = (e) => {
        if (e.data === "ping" && sessionStorage.getItem(SESSION_ALIVE_KEY)) ch.postMessage("pong");
      };
    } catch {
      channel = null; // BroadcastChannel unsupported: fall back to per-tab behaviour
    }

    const askOtherTabs = () => new Promise<boolean>((resolve) => {
      const ch = channel;
      if (!ch) return resolve(false);
      const onPong = (e: MessageEvent) => {
        if (e.data !== "pong") return;
        clearTimeout(timer);
        ch.removeEventListener("message", onPong);
        resolve(true);
      };
      const timer = setTimeout(() => {
        ch.removeEventListener("message", onPong);
        resolve(false);
      }, 300);
      ch.addEventListener("message", onPong);
      ch.postMessage("ping");
    });

    const MAX_AGE = 8 * 60 * 60 * 1000;

    const checkSessionAge = async () => {
      const raw = localStorage.getItem(LAST_ACTIVE_KEY);
      if (raw && Date.now() - Number(raw) > MAX_AGE) {
        await autoSignOut();
      }
    };

    const start = async () => {
      if (!sessionStorage.getItem(SESSION_ALIVE_KEY)) {
        const alive = await askOtherTabs();
        if (cancelled) return;
        if (!alive) {
          // No other tab of this browser session answered: the browser was reopened.
          await autoSignOut();
          return;
        }
        sessionStorage.setItem(SESSION_ALIVE_KEY, "1");
      }
      await checkSessionAge();
    };

    start().catch(() => {});

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkSessionAge().catch(() => {});
    };
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkSessionAge().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      cancelled = true;
      channel?.close();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [user, autoSignOut]);

  return handleSignOut;
}
