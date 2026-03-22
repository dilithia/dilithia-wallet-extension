import { useState, useEffect, useCallback } from "preact/hooks";

/**
 * Mirrors the original getPendingApprovals / approvePending / rejectPending.
 * Polls every 1.5s when there are pending items (matches original renderTimer).
 */
export function useApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_GET_PENDING" });
      setItems(res?.ok ? res.result ?? [] : []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, 1500);
    return () => clearInterval(timer);
  }, [fetch]);

  const approve = useCallback(async (approvalId) => {
    const res = await chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_APPROVE", approvalId });
    if (!res?.ok) throw new Error(res?.error ?? "Failed to approve");
    await fetch();
  }, [fetch]);

  const reject = useCallback(async (approvalId) => {
    const res = await chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_REJECT", approvalId });
    if (!res?.ok) throw new Error(res?.error ?? "Failed to reject");
    await fetch();
  }, [fetch]);

  return { items, loading, approve, reject, refresh: fetch };
}
