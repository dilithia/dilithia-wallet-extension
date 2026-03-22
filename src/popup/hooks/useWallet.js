import { useState, useEffect, useCallback } from "preact/hooks";

const WALLET_KEY = "dilithia.wallet";
const RECOVERY_KEY = "dilithia.walletRecovery";

export function useWallet() {
  const [wallet, setWalletState] = useState(null);
  const [recovery, setRecoveryState] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await chrome.storage.local.get([WALLET_KEY, RECOVERY_KEY]);
    setWalletState(data[WALLET_KEY] ?? null);
    setRecoveryState(data[RECOVERY_KEY] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Listen for external changes
  useEffect(() => {
    const listener = (changes, area) => {
      if (area !== "local") return;
      if (changes[WALLET_KEY]) setWalletState(changes[WALLET_KEY].newValue ?? null);
      if (changes[RECOVERY_KEY]) setRecoveryState(changes[RECOVERY_KEY].newValue ?? null);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const setWallet = useCallback(async (w) => {
    await chrome.storage.local.set({ [WALLET_KEY]: w });
    setWalletState(w);
  }, []);

  const setRecovery = useCallback(async (r) => {
    await chrome.storage.local.set({ [RECOVERY_KEY]: r });
    setRecoveryState(r);
  }, []);

  return { wallet, recovery, loading, setWallet, setRecovery, reload: load };
}
