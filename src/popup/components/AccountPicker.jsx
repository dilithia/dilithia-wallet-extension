import { useState } from "preact/hooks";
import { truncateAddress } from "../lib/format.js";
import { getWalletAccounts } from "../lib/wallet-model.js";

/**
 * Account picker dialog — shows a searchable list of the user's HD accounts.
 * Returns the selected account object (with .address, .label, .accountIndex).
 * Also allows manual address entry for external recipients.
 */
export function AccountPicker({ wallet, open, onClose, onSelect, allowExternal = true, excludeAddress }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const accounts = getWalletAccounts(wallet).filter((a) => a.address !== excludeAddress);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? accounts.filter((a) =>
        a.label.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q) ||
        String(a.accountIndex).includes(q)
      )
    : accounts;

  const handleSelectExternal = () => {
    if (!q || filtered.length > 0) return; // only if no match
    onSelect({ address: search.trim(), label: truncateAddress(search.trim()), external: true });
    setSearch("");
  };

  return (
    <div class="dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setSearch(""); } }}>
      <div class="dialog-card" style={{ maxHeight: 420, display: "flex", flexDirection: "column" }}>
        <h3 class="dialog-title" style={{ paddingBottom: 8 }}>Select Account</h3>

        <input
          class="input"
          placeholder="Search accounts or paste address"
          value={search}
          onInput={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ marginBottom: 8 }}
        />

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {filtered.map((account) => (
            <button
              key={account.id}
              onClick={() => { onSelect(account); setSearch(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 4px",
                background: "none", border: "none", cursor: "pointer",
                width: "100%", textAlign: "left", font: "inherit",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "var(--color-accent)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13,
              }}>
                {account.accountIndex + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{account.label}</div>
                <div class="text-mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  {truncateAddress(account.address)}
                </div>
              </div>
            </button>
          ))}

          {filtered.length === 0 && q && allowExternal && (
            <button
              onClick={handleSelectExternal}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 4px",
                background: "none", border: "none", cursor: "pointer",
                width: "100%", textAlign: "left", font: "inherit",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "#f5f0eb", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14, color: "var(--color-muted)",
              }}>
                →
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Use as external address</div>
                <div class="text-mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  {truncateAddress(q)}
                </div>
              </div>
            </button>
          )}

          {filtered.length === 0 && !q && (
            <p class="text-body text-center" style={{ padding: 16, fontSize: 12 }}>No other accounts</p>
          )}
        </div>
      </div>
    </div>
  );
}
