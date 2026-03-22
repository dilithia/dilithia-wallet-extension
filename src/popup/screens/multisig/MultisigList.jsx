import { NavHeader } from "../../components/NavHeader.jsx";
import { useMyMultisigs } from "../../hooks/useMultisig.js";
import { formatThreshold } from "../../lib/multisig-model.js";
import { truncateAddress } from "../../lib/format.js";

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--color-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function MultisigListScreen({ address, onBack, onSelect, onCreate }) {
  const { wallets, loading, error } = useMyMultisigs(address);

  return (
    <div class="screen">
      <NavHeader title="Multisig" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-md">

          {loading && <p class="text-body text-center" style={{ paddingTop: 32 }}>Loading...</p>}

          {!loading && error && <p class="text-error text-center">{error}</p>}

          {!loading && !error && wallets.length === 0 && (
            <div class="text-center" style={{ paddingTop: 48 }}>
              <div style={{ margin: "0 auto 12px" }}><UsersIcon /></div>
              <p class="text-body">No multisig wallets found.</p>
              <p class="text-body" style={{ fontSize: 12 }}>Create one or join an existing multisig as a signer.</p>
            </div>
          )}

          {wallets.map((w) => (
            <button
              key={w.wallet_id}
              onClick={() => onSelect(w.wallet_id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 12px",
                background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius)",
                cursor: "pointer", width: "100%", textAlign: "left", font: "inherit",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: "#fff7ed", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: 14, color: "var(--color-accent)",
              }}>
                {formatThreshold(w)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{w.wallet_id}</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                  {w.signers?.length ?? 0} signers · {truncateAddress(w.creator ?? "")}
                </div>
              </div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-muted)" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          ))}

          <button class="btn btn-subtle" onClick={onCreate} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <PlusIcon /> Create Multisig
          </button>
        </div>
      </div>
    </div>
  );
}
