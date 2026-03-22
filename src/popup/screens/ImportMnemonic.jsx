import { useState } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";

export function ImportMnemonicScreen({ onImport, onBack }) {
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleImport = async () => {
    const trimmed = mnemonic.trim();
    if (!trimmed) { setError("Enter your recovery phrase"); return; }

    setError(null);
    setBusy(true);
    try {
      await onImport(trimmed);
    } catch (e) {
      setError(e.message ?? "Invalid recovery phrase");
      setBusy(false);
    }
  };

  return (
    <div class="screen">
      <NavHeader title="Import Wallet" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg" style={{ maxWidth: 300, margin: "0 auto" }}>
          <div class="field">
            <label class="field-label">Recovery phrase</label>
            <textarea
              class="input"
              rows={4}
              placeholder="Enter your 24-word recovery phrase"
              value={mnemonic}
              onInput={(e) => setMnemonic(e.target.value)}
              autoFocus
            />
            <p class="text-body" style={{ fontSize: 12 }}>Words separated by spaces.</p>
          </div>
          {error && <p class="text-error">{error}</p>}
          <button class="btn btn-primary" onClick={handleImport} disabled={busy}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
