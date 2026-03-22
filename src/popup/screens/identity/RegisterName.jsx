import { useState } from "preact/hooks";
import { NavHeader } from "../../components/NavHeader.jsx";
import { TxStatus } from "../../components/TxStatus.jsx";
import { isNameAvailable, registerName } from "../../lib/identity-model.js";

// ── Pricing (from qsc-rs ROADMAP.md ID1) ─────────────────────────────
// 1 DILI = $100 ref. Cost burned on-chain, not sent to treasury.

const PRICING = [
  { maxLen: 3, cost: 100, label: "100 DILI" },
  { maxLen: 4, cost: 10, label: "10 DILI" },
  { maxLen: 5, cost: 1, label: "1 DILI" },
  { maxLen: Infinity, cost: 0.1, label: "0.1 DILI" },
];

function getNameCost(name) {
  const len = name.trim().length;
  for (const tier of PRICING) {
    if (len <= tier.maxLen) return tier;
  }
  return PRICING[PRICING.length - 1];
}

export function RegisterNameScreen({ onBack, onRegistered }) {
  const [name, setName] = useState("");
  const [available, setAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim().toLowerCase();
  const tier = trimmed.length >= 3 ? getNameCost(trimmed) : null;

  const handleCheck = async () => {
    if (!trimmed || trimmed.length < 3) { setStatus({ error: "Name must be at least 3 characters" }); return; }
    setChecking(true);
    setAvailable(null);
    setStatus(null);
    try {
      const result = await isNameAvailable(trimmed);
      setAvailable(result);
      if (!result) setStatus({ error: `${trimmed}.dili is already taken` });
    } catch (e) {
      setStatus({ error: e.message ?? "Check failed" });
    }
    setChecking(false);
  };

  const handleRegister = async () => {
    setBusy(true);
    setStatus(null);
    setStep("approval");
    try {
      await registerName(trimmed);
      setStep(null);
      setStatus({ success: `${trimmed}.dili registered!` });
      if (onRegistered) onRegistered(trimmed);
    } catch (e) {
      setStep(null);
      setStatus({ error: e.message ?? "Registration failed" });
    }
    setBusy(false);
  };

  return (
    <div class="screen">
      <NavHeader title="Register Name" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">
          <p class="text-body">
            Register a <strong>.dili</strong> name as your on-chain identity. The cost is burned to prevent squatting.
          </p>

          {/* Name input */}
          <div class="field">
            <label class="field-label">Name</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                class="input"
                style={{ flex: 1 }}
                placeholder="alice"
                value={name}
                onInput={(e) => { setName(e.target.value); setAvailable(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
              <span style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 500, color: "var(--color-muted)" }}>.dili</span>
            </div>
          </div>

          {/* Cost preview */}
          {tier && (
            <div class="card">
              <div class="card-row">
                <span class="card-label">Name length</span>
                <span class="card-value">{trimmed.length} chars</span>
              </div>
              <div class="card-row">
                <span class="card-label">Registration cost</span>
                <span class="card-value" style={{ fontWeight: 700, color: "var(--color-accent)" }}>{tier.label}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Renewal</span>
                <span class="card-value">{tier.label} / period</span>
              </div>
              <div style={{ paddingTop: 6, fontSize: 11, color: "var(--color-muted)" }}>
                Cost is burned (deflationary). Records are free after registration.
              </div>
            </div>
          )}

          {/* Pricing table */}
          {!tier && trimmed.length > 0 && trimmed.length < 3 && (
            <p class="text-body" style={{ fontSize: 12, color: "var(--color-error)" }}>
              Minimum 3 characters
            </p>
          )}

          {/* Check availability */}
          {available === null && trimmed.length >= 3 && (
            <button class="btn btn-subtle" onClick={handleCheck} disabled={checking}>
              {checking ? "Checking..." : "Check Availability"}
            </button>
          )}

          {available === true && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              background: "#eafbf0", color: "var(--color-success)", fontWeight: 500, fontSize: 13,
            }}>
              <span>✓</span> {trimmed}.dili is available
            </div>
          )}

          <TxStatus step={step} status={status} />

          {available === true && (
            <button class="btn btn-primary" onClick={handleRegister} disabled={busy}>
              {busy ? "Registering..." : `Register ${trimmed}.dili for ${tier?.label}`}
            </button>
          )}

          {/* Pricing reference */}
          {!available && (
            <div style={{ paddingTop: 8 }}>
              <p class="card-label" style={{ paddingBottom: 6 }}>Pricing</p>
              <div class="card" style={{ fontSize: 12 }}>
                {PRICING.map((p, i) => (
                  <div key={i} class="card-row">
                    <span>{p.maxLen === Infinity ? "6+" : p.maxLen} chars</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
