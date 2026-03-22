import { useState, useEffect } from "preact/hooks";

function truncateHash(hash) {
  if (!hash || hash.length < 16) return hash ?? "";
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

export function ActivityScreen({ wallet }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet?.address) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const settings = await chrome.storage.local.get("dilithia.settings");
        const rpcUrl = settings["dilithia.settings"]?.rpcUrl ?? "http://127.0.0.1:8000/rpc";
        const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
        const res = await fetch(`${baseUrl}/address/${encodeURIComponent(wallet.address)}/txs`, { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTxs(Array.isArray(data) ? data.slice(0, 50) : []);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [wallet?.address]);

  return (
    <div class="screen-scroll">
      <div class="stack stack-sm">
        {loading && <p class="text-body text-center">Loading...</p>}
        {!loading && txs.length === 0 && (
          <p class="text-body text-center" style={{ paddingTop: 48 }}>No activity yet</p>
        )}
        {txs.map((tx, i) => (
          <div key={i} class="list-item">
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                {tx.method ?? tx.type ?? "Transaction"}
              </p>
              <p class="text-body text-mono" style={{ fontSize: 11 }}>
                {truncateHash(tx.tx_hash ?? tx.hash)}
              </p>
            </div>
            <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
              {tx.status ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
