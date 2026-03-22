/**
 * Multisig domain model — helpers for the qsc-rs multisig native contract.
 *
 * On-chain contract: "multisig"
 * Mutations: create, propose_tx, approve, execute, revoke, add_signer, remove_signer
 * Queries: wallet, pending_tx, pending_txs, wallets_by_signer
 */

const STORAGE_KEY = "dilithia.multisigWallets";

/**
 * Query the multisig contract via RPC.
 */
async function queryMultisig(method, args) {
  const settingsData = await chrome.storage.local.get("dilithia.settings");
  const rpcUrl = settingsData["dilithia.settings"]?.rpcUrl ?? "http://127.0.0.1:8000/rpc";
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "qsc_query", params: { contract: "multisig", method, args } }),
  });
  if (!res.ok) throw new Error(`Multisig query failed: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "Query failed");
  return data.result;
}

/**
 * Send a multisig mutation via the provider.
 */
export async function multisigCall(method, args) {
  const res = await chrome.runtime.sendMessage({
    type: "DILITHIA_PROVIDER_REQUEST",
    origin: "chrome-extension://popup",
    method: "dilithia_sendTransaction",
    params: { transaction: { contract: "multisig", method, args } },
  });
  if (!res?.ok) throw new Error(res?.error ?? `multisig.${method} failed`);
  return res.result;
}

// ── Queries ──────────────────────────────────────────────────────────

export async function fetchWallet(walletId) {
  return queryMultisig("wallet", { wallet_id: walletId });
}

export async function fetchPendingTxs(walletId) {
  const result = await queryMultisig("pending_txs", { wallet_id: walletId });
  return result?.pending_txs ?? [];
}

export async function fetchPendingTx(walletId, txId) {
  return queryMultisig("pending_tx", { wallet_id: walletId, tx_id: txId });
}

/**
 * Fetch wallets where address is a signer.
 * Tries on-chain query first (wallets_by_signer), falls back to local storage.
 */
export async function fetchMyMultisigs(address) {
  // Try on-chain index first
  try {
    const result = await queryMultisig("wallets_by_signer", { address });
    if (Array.isArray(result?.wallets) && result.wallets.length > 0) {
      return result.wallets;
    }
  } catch {
    // Query not available yet — fall back to local list
  }

  // Fallback: local storage list
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const walletIds = data[STORAGE_KEY] ?? [];
  const wallets = [];
  for (const id of walletIds) {
    try {
      const w = await fetchWallet(id);
      if (w && Array.isArray(w.signers) && w.signers.includes(address)) {
        wallets.push(w);
      }
    } catch { /* skip unreachable wallets */ }
  }
  return wallets;
}

// ── Local storage for wallet IDs (fallback until on-chain index) ─────

export async function addLocalMultisig(walletId) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const ids = data[STORAGE_KEY] ?? [];
  if (!ids.includes(walletId)) {
    await chrome.storage.local.set({ [STORAGE_KEY]: [...ids, walletId] });
  }
}

export async function removeLocalMultisig(walletId) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const ids = (data[STORAGE_KEY] ?? []).filter((id) => id !== walletId);
  await chrome.storage.local.set({ [STORAGE_KEY]: ids });
}

// ── Display helpers ──────────────────────────────────────────────────

export function formatThreshold(wallet) {
  return `${wallet.threshold}-of-${wallet.signers?.length ?? "?"}`;
}

export function txStatusColor(status) {
  if (status === "executed") return "var(--color-success)";
  if (status === "failed") return "var(--color-error)";
  return "var(--color-accent)";
}

export function approvalProgress(tx, threshold) {
  const count = tx.approvals?.length ?? 0;
  return { count, threshold, ready: count >= threshold, percent: Math.min(100, Math.round((count / threshold) * 100)) };
}
