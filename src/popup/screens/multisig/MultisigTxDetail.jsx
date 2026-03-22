import { useState, useEffect } from "preact/hooks";
import { NavHeader } from "../../components/NavHeader.jsx";
import { fetchPendingTx, fetchWallet, multisigCall, approvalProgress, txStatusColor } from "../../lib/multisig-model.js";
import { truncateAddress } from "../../lib/format.js";

export function MultisigTxDetailScreen({ walletId, txId, myAddress, onBack }) {
  const [tx, setTx] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // "approve" | "revoke" | "execute" | null
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [t, w] = await Promise.all([fetchPendingTx(walletId, txId), fetchWallet(walletId)]);
      setTx(t);
      setWallet(w);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [walletId, txId]);

  const handleAction = async (action) => {
    setBusy(action);
    setResult(null);
    setError(null);
    try {
      await multisigCall(action, { wallet_id: walletId, tx_id: txId });
      setResult({ action, ok: true });
      await load(); // refresh state
    } catch (e) {
      setError(e.message);
    }
    setBusy(null);
  };

  if (loading) {
    return (
      <div class="screen">
        <NavHeader title={`TX #${txId}`} onBack={onBack} />
        <div class="screen-centered"><p class="text-body">Loading...</p></div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div class="screen">
        <NavHeader title={`TX #${txId}`} onBack={onBack} />
        <div class="screen-centered"><p class="text-error">{error ?? "Transaction not found"}</p></div>
      </div>
    );
  }

  const prog = approvalProgress(tx, wallet?.threshold ?? 1);
  const iApproved = tx.approvals?.includes(myAddress);
  const isPending = tx.status === "pending";
  const canApprove = isPending && !iApproved;
  const canRevoke = isPending && iApproved;
  const canExecute = isPending && prog.ready;

  return (
    <div class="screen">
      <NavHeader title={`TX #${txId}`} onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">

          {/* Status badge */}
          <div class="text-center">
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 12,
              background: isPending ? "#fff7ed" : tx.status === "executed" ? "#eafbf0" : "#fdeaea",
              color: txStatusColor(tx.status),
            }}>
              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
            </span>
          </div>

          {/* What it does */}
          <div class="card">
            <div class="card-row">
              <span class="card-label">Contract</span>
              <span class="card-value">{tx.contract}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Method</span>
              <span class="card-value" style={{ fontWeight: 600 }}>{tx.method}</span>
            </div>
            {tx.args && Object.keys(tx.args).length > 0 && (
              <div style={{ paddingTop: 8 }}>
                <span class="card-label">Arguments</span>
                <div class="text-mono" style={{ fontSize: 11, paddingTop: 4, wordBreak: "break-all", lineHeight: 1.6 }}>
                  {Object.entries(tx.args).map(([k, v]) => (
                    <div key={k}><span style={{ color: "var(--color-muted)" }}>{k}:</span> {JSON.stringify(v)}</div>
                  ))}
                </div>
              </div>
            )}
            <div class="card-row">
              <span class="card-label">Proposer</span>
              <span class="card-value text-mono" style={{ fontSize: 11 }}>{truncateAddress(tx.proposer)}</span>
            </div>
          </div>

          {/* Approval progress */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8 }}>
              <span class="card-label">Approvals</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: prog.ready ? "var(--color-success)" : "var(--color-accent)" }}>
                {prog.count} / {prog.threshold}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 3, background: "var(--color-border)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, transition: "width 0.3s",
                width: `${prog.percent}%`,
                background: prog.ready ? "var(--color-success)" : "var(--color-accent)",
              }} />
            </div>

            {/* Signer list with approval status */}
            <div style={{ paddingTop: 12 }}>
              {(wallet?.signers ?? []).map((signer) => {
                const approved = tx.approvals?.includes(signer);
                const isMe = signer === myAddress;
                return (
                  <div key={signer} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700,
                      background: approved ? "var(--color-success)" : "var(--color-border)",
                      color: approved ? "#fff" : "var(--color-muted)",
                    }}>
                      {approved ? "✓" : "·"}
                    </span>
                    <span class="text-mono" style={{ fontSize: 11, flex: 1, color: isMe ? "var(--color-text)" : "var(--color-muted)" }}>
                      {isMe ? `${truncateAddress(signer)} (you)` : truncateAddress(signer)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error from failed tx */}
          {tx.error && (
            <div class="card" style={{ background: "#fdeaea", color: "var(--color-error)", fontSize: 12 }}>
              {tx.error}
            </div>
          )}

          {/* Action result */}
          {result?.ok && (
            <p style={{ color: "var(--color-success)", fontSize: 13, textAlign: "center" }}>
              {result.action === "approve" && "Approved ✓"}
              {result.action === "revoke" && "Approval revoked"}
              {result.action === "execute" && "Executed ✓"}
            </p>
          )}
          {error && <p class="text-error text-center">{error}</p>}

          {/* Action buttons */}
          {isPending && (
            <div class="stack stack-sm">
              {canExecute && (
                <button class="btn btn-primary" onClick={() => handleAction("execute")} disabled={!!busy}>
                  {busy === "execute" ? "Executing..." : "Execute"}
                </button>
              )}
              {canApprove && (
                <button class="btn btn-primary" onClick={() => handleAction("approve")} disabled={!!busy}>
                  {busy === "approve" ? "Approving..." : "Approve"}
                </button>
              )}
              {canRevoke && (
                <button class="btn btn-subtle" onClick={() => handleAction("revoke")} disabled={!!busy} style={{ color: "var(--color-error)" }}>
                  {busy === "revoke" ? "Revoking..." : "Revoke My Approval"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
