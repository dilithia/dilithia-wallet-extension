import { useState, useEffect } from "preact/hooks";

const SETTINGS_KEY = "dilithia.settings";

async function getSettings() {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return data[SETTINGS_KEY] ?? {};
}

export function useBalance(address) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }

    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        const rpcUrl = settings.rpcUrl ?? "http://127.0.0.1:8000/rpc";
        const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
        const res = await fetch(`${baseUrl}/balance/${encodeURIComponent(address)}`, { cache: "no-store" });
        if (res.ok && !cancelled) {
          setBalance(await res.json());
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [address]);

  return { balance, loading };
}
