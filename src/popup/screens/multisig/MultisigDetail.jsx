import { useState } from "preact/hooks";
import { NavHeader } from "../../components/NavHeader.jsx";
import { useMultisig } from "../../hooks/useMultisig.js";
import { formatThreshold, approvalProgress, txStatusColor } from "../../lib/multisig-model.js";
import { truncateAddress, truncate } from "../../lib/format.js";

export function MultisigDetailScreen({ walletId, myAddress, onBack, onTxSelect, onPropose }) {
  const { wallet, pendingTxs, loading, error } = useMultisig(walletId);
  const [tab, setTab] = useState("pending");

  if (loading) {
    return (
      <div class="screen">
        <NavHeader title={walletId} onBack={onBack} />
        <div class="screen-centered"><p class="text-body">Loading...</p></div>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div class="screen">
        <NavHeader title={walletId} onBack={onBack} />
        <div class="screen-centered"><p class="text-error">{error ?? "Wallet not found"}</p></div>
      </div>
    );
  }

  const pending = pendingTxs.filter((tx) => tx.status === "pending");
  const history = pendingTxs.filter((tx) => tx.status !== "pending");

  return (
    <div class="screen">
      <NavHeader title={walletId} onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">

          {/* Wallet info card */}
          <div class="card">
            <div class="card-row">
              <span class="card-label">Threshold</span>
              <span class="card-value">{formatThreshold(wallet)}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Signers</span>
              <span class="card-value" style={{ textAlign: "right" }}>{wallet.signers?.length ?? 0}</span>
            </div>
          </div>

          {/* Signers list */}
          <div>
            <p class="card-label" style={{ paddingBottom: 6 }}>Signers</p>
            {(wallet.signers ?? []).map((signer) => (
              <div key={signer} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: signer === myAddress ? "var(--color-accent)" : "#f5f0eb",
                  color: signer === myAddress ? "#fff" : "var(--color-text)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                }}>
                  {signer === myAddress ? "Me" : signer.slice(-2).toUpperCase()}
                </div>
                <span class="text-mono" style={{ fontSize: 12, flex: 1 }}>
                  {signer === myAddress ? `${truncateAddress(signer)} (you)` : truncateAddress(signer)}
                </span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
            {[
              { id: "pending", label: `Pending (${pending.length})` },
              { id: "history", label: "History" },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                font: "inherit", fontWeight: 600, fontSize: 13,
                color: tab === t.id ? "var(--color-accent)" : "var(--color-muted)",
                borderBottom: tab === t.id ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Pending txs */}
          {tab === "pending" && (
            <div class="stack stack-sm">
              {pending.length === 0 && <p class="text-body text-center">No pending transactions</p>}
              {pending.map((tx) => {
                const prog = approvalProgress(tx, wallet.threshold);
                const iApproved = tx.approvals?.includes(myAddress);
                return (
                  <button
                    key={tx.tx_id}
                    onClick={() => onTxSelect(tx.tx_id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px",
                      background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius)",
                      cursor: "pointer", width: "100%", textAlign: "left", font: "inherit",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {tx.contract}.{tx.method}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                        #{tx.tx_id} · {prog.count}/{prog.threshold} approvals
                        {iApproved && <span style={{ color: "var(--color-success)" }}> · signed</span>}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: 40, height: 40, position: "relative" }}>
                      <svg viewBox="0 0 36 36" width="40" height="40">
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="var(--color-border)" stroke-width="3" />
                        <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke={prog.ready ? "var(--color-success)" : "var(--color-accent)"}
                          stroke-width="3" stroke-dasharray={`${prog.percent}, 100`} />
                      </svg>
                      <span style={{
                        position: "absolute", inset: 0, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 10, fontWeight: 700,
                        color: prog.ready ? "var(--color-success)" : "var(--color-accent)",
                      }}>{prog.count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* History */}
          {tab === "history" && (
            <div class="stack stack-sm">
              {history.length === 0 && <p class="text-body text-center">No history</p>}
              {history.map((tx) => (
                <div key={tx.tx_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <span style={{ fontSize: 14, color: txStatusColor(tx.status) }}>
                    {tx.status === "executed" ? "✓" : "✗"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{tx.contract}.{tx.method}</span>
                    <span style={{ fontSize: 12, color: "var(--color-muted)", marginLeft: 8 }}>#{tx.tx_id}</span>
                  </div>
                  <span style={{ fontSize: 11, color: txStatusColor(tx.status), fontWeight: 500 }}>{tx.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Propose button */}
          <button class="btn btn-primary" onClick={onPropose}>
            Propose Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
