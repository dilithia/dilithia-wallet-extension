import { useState, useEffect, useCallback } from "preact/hooks";
import { fetchMyMultisigs, fetchWallet, fetchPendingTxs } from "../lib/multisig-model.js";

/**
 * Hook: list of multisig wallets where I'm a signer.
 */
export function useMyMultisigs(address) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!address) { setLoading(false); return; }
    try {
      const result = await fetchMyMultisigs(address);
      setWallets(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => { load(); }, [load]);

  return { wallets, loading, error, refresh: load };
}

/**
 * Hook: single multisig wallet detail + pending txs.
 * Polls pending txs every 5s.
 */
export function useMultisig(walletId) {
  const [wallet, setWallet] = useState(null);
  const [pendingTxs, setPendingTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!walletId) { setLoading(false); return; }
    try {
      const [w, txs] = await Promise.all([
        fetchWallet(walletId),
        fetchPendingTxs(walletId),
      ]);
      setWallet(w);
      setPendingTxs(txs);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [walletId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  return { wallet, pendingTxs, loading, error, refresh: load };
}
