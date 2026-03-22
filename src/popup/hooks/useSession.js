import { useState, useEffect, useCallback } from "preact/hooks";

export function useSession() {
  const [state, setState] = useState({ loading: true, locked: false, hasPassword: false, hasWallet: false });

  const check = useCallback(async () => {
    try {
      const [lockRes, walletData] = await Promise.all([
        chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_IS_LOCKED" }),
        chrome.storage.local.get("dilithia.wallet"),
      ]);
      setState({
        loading: false,
        locked: lockRes?.result?.locked ?? false,
        hasPassword: lockRes?.result?.hasPassword ?? false,
        hasWallet: Boolean(walletData["dilithia.wallet"]),
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const unlock = useCallback(async (password) => {
    const res = await chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_UNLOCK", password });
    if (res?.ok) {
      await check();
      return { ok: true };
    }
    return { ok: false, error: res?.error ?? "Incorrect password" };
  }, [check]);

  const lock = useCallback(async () => {
    await chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_LOCK" });
    await check();
  }, [check]);

  return { ...state, check, unlock, lock };
}
