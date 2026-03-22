import { useState, useEffect } from "preact/hooks";

/**
 * Mirrors the original fetchWalletOverview + shielded summary logic.
 * Returns { overview, loading, error } with the same shape as the original:
 *   balance, txCount, nonce, stake, tokenHoldings, nftHoldings, recentTxs, shieldedSummary
 */
export function useOverview(address) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const settingsData = await chrome.storage.local.get("dilithia.settings");
        const settings = settingsData["dilithia.settings"] ?? {};
        const rpcUrl = settings.rpcUrl ?? "http://127.0.0.1:8000/rpc";
        const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");

        // Parallel fetch: balance, addressSummary, txs — same as original fetchWalletOverview
        const [balanceRes, summaryRes, txsRes] = await Promise.all([
          fetch(`${baseUrl}/balance/${encodeURIComponent(address)}`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : {}))
            .catch(() => ({})),
          fetch(rpcUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "qsc_addressSummary", params: { address } }),
          })
            .then((r) => (r.ok ? r.json() : {}))
            .then((d) => d.result ?? {})
            .catch(() => ({})),
          fetch(`${baseUrl}/address/${encodeURIComponent(address)}/txs`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : { tx_hashes: [] }))
            .catch(() => ({ tx_hashes: [] })),
        ]);

        // Shielded notes from local storage
        const shieldedData = await chrome.storage.local.get("dilithia.shieldedState");
        const shieldedState = shieldedData["dilithia.shieldedState"] ?? { notesByAddress: {} };
        const notes = shieldedState.notesByAddress?.[address] ?? [];
        const liveNotes = notes.filter((n) => !n.spent);

        const txHashes = Array.isArray(txsRes?.tx_hashes) ? txsRes.tx_hashes : [];

        if (!cancelled) {
          setOverview({
            balance: balanceRes.balance ?? 0,
            txCount: summaryRes.tx_count ?? 0,
            nonce: summaryRes.nonce ?? 0,
            stake: summaryRes.stake ?? 0,
            tokenHoldings: Array.isArray(summaryRes.token_holdings) ? summaryRes.token_holdings : [],
            nftHoldings: Array.isArray(summaryRes.nft_holdings) ? summaryRes.nft_holdings : [],
            recentTxs: txHashes.slice(-5).reverse(),
            shieldedSummary: {
              noteCount: liveNotes.length,
              totalValue: liveNotes.reduce((sum, n) => sum + Number(n.amount ?? 0), 0),
            },
          });
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [address]);

  return { overview, loading, error };
}
