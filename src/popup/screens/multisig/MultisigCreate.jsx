import { useState } from "preact/hooks";
import { NavHeader } from "../../components/NavHeader.jsx";
import { multisigCall, addLocalMultisig } from "../../lib/multisig-model.js";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

export function MultisigCreateScreen({ myAddress, onBack, onCreated }) {
  const [walletId, setWalletId] = useState("");
  const [signers, setSigners] = useState([myAddress]);
  const [newSigner, setNewSigner] = useState("");
  const [threshold, setThreshold] = useState("2");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const addSigner = () => {
    const addr = newSigner.trim();
    if (!addr) return;
    if (signers.includes(addr)) { setError("Signer already added"); return; }
    setSigners([...signers, addr]);
    setNewSigner("");
    setError(null);
  };

  const removeSigner = (addr) => {
    if (addr === myAddress) { setError("Cannot remove yourself"); return; }
    setSigners(signers.filter((s) => s !== addr));
  };

  const handleCreate = async () => {
    const id = walletId.trim();
    if (!id) { setError("Wallet ID is required"); return; }
    if (signers.length < 2) { setError("At least 2 signers required"); return; }
    const th = parseInt(threshold, 10);
    if (!th || th < 1 || th > signers.length) { setError(`Threshold must be 1-${signers.length}`); return; }

    setBusy(true);
    setError(null);
    try {
      await multisigCall("create", { wallet_id: id, signers, threshold: th });
      await addLocalMultisig(id);
      if (onCreated) onCreated(id);
    } catch (e) {
      setError(e.message ?? "Failed to create");
      setBusy(false);
    }
  };

  return (
    <div class="screen">
      <NavHeader title="Create Multisig" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">

          <div class="field">
            <label class="field-label">Wallet ID</label>
            <input class="input" value={walletId} onInput={(e) => setWalletId(e.target.value)} placeholder="treasury" />
          </div>

          {/* Signers */}
          <div>
            <p class="card-label" style={{ paddingBottom: 8 }}>Signers</p>
            <div class="stack stack-sm">
              {signers.map((signer) => (
                <div key={signer} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span class="text-mono" style={{ flex: 1, fontSize: 12 }}>
                    {signer === myAddress ? `${signer} (you)` : signer}
                  </span>
                  {signer !== myAddress && (
                    <button onClick={() => removeSigner(signer)} style={{
                      background: "none", border: "none", cursor: "pointer", padding: 4,
                      color: "var(--color-error)", borderRadius: 4,
                    }}><TrashIcon /></button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
              <input class="input" style={{ flex: 1, fontSize: 12 }} value={newSigner} onInput={(e) => setNewSigner(e.target.value)}
                placeholder="dili1..." onKeyDown={(e) => e.key === "Enter" && addSigner()} />
              <button class="btn btn-subtle" onClick={addSigner} style={{ width: "auto", padding: "8px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                <PlusIcon /> Add
              </button>
            </div>
          </div>

          {/* Threshold */}
          <div class="field">
            <label class="field-label">Threshold ({threshold}-of-{signers.length})</label>
            <input class="input" type="number" min="1" max={signers.length} value={threshold}
              onInput={(e) => setThreshold(e.target.value)} style={{ textAlign: "right" }} />
            <p class="text-body" style={{ fontSize: 12 }}>
              Number of approvals required to execute a transaction.
            </p>
          </div>

          {error && <p class="text-error">{error}</p>}

          <button class="btn btn-primary" onClick={handleCreate} disabled={busy}>
            {busy ? "Creating..." : `Create ${threshold}-of-${signers.length} Multisig`}
          </button>
        </div>
      </div>
    </div>
  );
}
