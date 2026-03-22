import { useState } from "preact/hooks";
import { NavHeader } from "../../components/NavHeader.jsx";
import { multisigCall } from "../../lib/multisig-model.js";

export function MultisigProposeScreen({ walletId, onBack, onProposed }) {
  const [contract, setContract] = useState("");
  const [method, setMethod] = useState("");
  const [argsJson, setArgsJson] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handlePropose = async () => {
    if (!contract.trim()) { setError("Contract is required"); return; }
    if (!method.trim()) { setError("Method is required"); return; }

    let args;
    try {
      args = JSON.parse(argsJson);
    } catch {
      setError("Arguments must be valid JSON");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await multisigCall("propose_tx", {
        wallet_id: walletId,
        contract: contract.trim(),
        method: method.trim(),
        args,
      });
      if (onProposed) onProposed(result?.tx_id);
    } catch (e) {
      setError(e.message ?? "Failed to propose");
      setBusy(false);
    }
  };

  return (
    <div class="screen">
      <NavHeader title="Propose Transaction" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">
          <p class="text-body">
            Propose a transaction for <strong>{walletId}</strong>. It will be auto-approved with your signature. Other signers must approve before execution.
          </p>

          <div class="field">
            <label class="field-label">Target Contract</label>
            <input class="input" value={contract} onInput={(e) => setContract(e.target.value)} placeholder="token" />
          </div>

          <div class="field">
            <label class="field-label">Method</label>
            <input class="input" value={method} onInput={(e) => setMethod(e.target.value)} placeholder="transfer" />
          </div>

          <div class="field">
            <label class="field-label">Arguments (JSON)</label>
            <textarea
              class="input"
              rows={4}
              value={argsJson}
              onInput={(e) => setArgsJson(e.target.value)}
              placeholder='{"to": "dili1...", "amount": 1000}'
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
          </div>

          {error && <p class="text-error">{error}</p>}

          <button class="btn btn-primary" onClick={handlePropose} disabled={busy}>
            {busy ? "Proposing..." : "Propose"}
          </button>
        </div>
      </div>
    </div>
  );
}
