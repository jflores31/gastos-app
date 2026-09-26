import { useState, useCallback, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  // The first render (server and hydration) always uses initialValue so the client
  // markup matches the server HTML; the stored value is applied right after mount.
  // Reading localStorage in the useState initializer made a stored dark theme render
  // different classNames on the client than on the server — a hydration mismatch
  // React doesn't patch up, leaving parts of the page with light-theme styles.
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from an external store after hydration
      if (item !== null) setStoredValue(JSON.parse(item));
    } catch {
      // private mode / blocked storage / invalid JSON: keep initialValue
    }
    // Other tabs of the app see the change too (the "storage" event only fires in
    // the tabs that didn't write). The inactivity timeout relies on it: a tab still
    // on the old value would sign every tab out early.
    const onStorage = (e) => {
      if (e.storageArea !== window.localStorage || e.key !== key || e.newValue === null) return;
      try {
        setStoredValue(JSON.parse(e.newValue));
      } catch {
        // invalid JSON written by someone else: ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
        } catch {
          // quota exceeded or private mode
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
