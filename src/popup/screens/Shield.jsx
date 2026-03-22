import { useState, useEffect } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";
import { TxStatus } from "../components/TxStatus.jsx";
import { truncate } from "../lib/format.js";

// ── SVG Icons ────────────────────────────────────────────────────────

const DepositIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

const WithdrawIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const ProofIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 12l2 2 4-4" /><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────

async function sendProviderRequest(method, params) {
  const res = await chrome.runtime.sendMessage({
    type: "DILITHIA_PROVIDER_REQUEST",
    origin: "chrome-extension://popup",
    method,
    params,
  });
  if (!res?.ok) throw new Error(res?.error ?? `${method} failed`);
  return res.result;
}

// ── Sub-views ────────────────────────────────────────────────────────

function DepositView({ onDone }) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleDeposit = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setStatus({ error: "Enter a valid amount" }); return; }
    setBusy(true);
    setStatus(null);
    setStep("approval");
    try {
      const result = await sendProviderRequest("dilithia_shieldedDeposit", { amount: n });
      setStep(null);
      setStatus({ success: `Deposited · ${truncate(result?.commitment ?? result?.txHash)}` });
      setAmount("");
      if (onDone) onDone();
    } catch (e) {
      setStep(null);
      setStatus({ error: e.message ?? "Deposit failed" });
    }
    setBusy(false);
  };

  return (
    <div class="stack stack-md">
      <div class="field">
        <label class="field-label">Amount</label>
        <input class="input" type="text" inputMode="numeric" placeholder="0" style={{ textAlign: "right" }} value={amount} onInput={(e) => setAmount(e.target.value)} />
      </div>
      <TxStatus step={step} status={status} />
      <button class="btn btn-primary" onClick={handleDeposit} disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <DepositIcon /> {busy ? "Depositing..." : "Deposit"}
      </button>
    </div>
  );
}

function WithdrawView({ notes, wallet, onDone }) {
  const [selectedIdx, setSelectedIdx] = useState("");
  const [recipient, setRecipient] = useState(wallet?.address ?? "");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState(null);
  const [busy, setBusy] = useState(false);

  const liveNotes = notes.filter((n) => !n.spent);

  const handleWithdraw = async () => {
    if (selectedIdx === "") { setStatus({ error: "Select a note" }); return; }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setStatus({ error: "Enter a valid amount" }); return; }
    if (!recipient.trim()) { setStatus({ error: "Enter a recipient" }); return; }
    setBusy(true);
    setStatus(null);
    setStep("approval");
    try {
      const result = await sendProviderRequest("dilithia_shieldedWithdraw", {
        commitmentIndex: Number(selectedIdx),
        amount: n,
        recipient: recipient.trim(),
      });
      setStep(null);
      setStatus({ success: `Withdrawn · ${truncate(result?.txHash ?? result?.nullifier)}` });
      setSelectedIdx("");
      setAmount("");
      if (onDone) onDone();
    } catch (e) {
      setStep(null);
      setStatus({ error: e.message ?? "Withdraw failed" });
    }
    setBusy(false);
  };

  return (
    <div class="stack stack-md">
      <div class="field">
        <label class="field-label">Note</label>
        <select class="input" value={selectedIdx} onChange={(e) => {
          setSelectedIdx(e.target.value);
          const note = liveNotes[Number(e.target.value)];
          if (note) setAmount(String(note.amount ?? note.value ?? ""));
        }}>
          <option value="">Select a shielded note</option>
          {liveNotes.map((note, i) => (
            <option key={i} value={i}>
              #{i} · {note.amount ?? note.value ?? "?"} · {truncate(note.commitment, 12)}
            </option>
          ))}
        </select>
      </div>
      <div class="field">
        <label class="field-label">Recipient</label>
        <input class="input" value={recipient} onInput={(e) => setRecipient(e.target.value)} placeholder="dili1..." />
      </div>
      <div class="field">
        <label class="field-label">Amount</label>
        <input class="input" type="text" inputMode="numeric" placeholder="0" style={{ textAlign: "right" }} value={amount} onInput={(e) => setAmount(e.target.value)} />
      </div>
      <TxStatus step={step} status={status} />
      <button class="btn btn-primary" onClick={handleWithdraw} disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <WithdrawIcon /> {busy ? "Withdrawing..." : "Withdraw"}
      </button>
    </div>
  );
}

function ComplianceView() {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [output, setOutput] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleGenerate = async () => {
    const minN = Number(min);
    const maxN = Number(max);
    if (!Number.isFinite(minN) || !Number.isFinite(maxN)) { setStatus({ error: "Enter valid range" }); return; }
    setBusy(true);
    setStatus(null);
    setOutput(null);
    try {
      const result = await sendProviderRequest("dilithia_shieldedComplianceProof", {
        proofType: "balance_range",
        min: minN,
        max: maxN,
      });
      setOutput(result);
    } catch (e) {
      setStatus({ error: e.message ?? "Proof generation failed" });
    }
    setBusy(false);
  };

  return (
    <div class="stack stack-md">
      <div style={{ display: "flex", gap: 8 }}>
        <div class="field" style={{ flex: 1 }}>
          <label class="field-label">Min</label>
          <input class="input" type="text" inputMode="numeric" placeholder="0" style={{ textAlign: "right" }} value={min} onInput={(e) => setMin(e.target.value)} />
        </div>
        <div class="field" style={{ flex: 1 }}>
          <label class="field-label">Max</label>
          <input class="input" type="text" inputMode="numeric" placeholder="1000000" style={{ textAlign: "right" }} value={max} onInput={(e) => setMax(e.target.value)} />
        </div>
      </div>
      <TxStatus status={status} />
      <button class="btn btn-subtle" onClick={handleGenerate} disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <ProofIcon /> {busy ? "Generating..." : "Generate Proof"}
      </button>
      {output && (
        <div class="card" style={{ fontSize: 11, fontFamily: "var(--font-mono)", wordBreak: "break-all", maxHeight: 120, overflowY: "auto" }}>
          {JSON.stringify(output, null, 2)}
        </div>
      )}
    </div>
  );
}

// ── Main Shield Screen ───────────────────────────────────────────────

export function ShieldScreen({ wallet }) {
  const [tab, setTab] = useState("deposit");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const address = wallet?.address ?? "";

  const loadNotes = async () => {
    try {
      const data = await chrome.storage.local.get("dilithia.shieldedState");
      const state = data["dilithia.shieldedState"] ?? { notesByAddress: {} };
      setNotes(state.notesByAddress?.[address] ?? []);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { if (address) loadNotes(); else setLoading(false); }, [address]);

  const liveNotes = notes.filter((n) => !n.spent);
  const totalValue = liveNotes.reduce((sum, n) => sum + Number(n.amount ?? 0), 0);

  const tabs = ["deposit", "withdraw", "proof"];

  return (
    <div class="screen-scroll">
      <div class="stack stack-lg" style={{ paddingTop: 8 }}>

        {/* Summary card */}
        <div class="card">
          <div class="card-row">
            <span class="card-label">Shielded Balance</span>
            <span class="card-value" style={{ textAlign: "right" }}>{loading ? "···" : totalValue}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Active Notes</span>
            <span class="card-value" style={{ textAlign: "right" }}>{loading ? "···" : liveNotes.length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
          {tabs.map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: "10px 0", background: "none", border: "none",
                cursor: "pointer", font: "inherit", fontWeight: 600, fontSize: 13,
                textTransform: "capitalize",
                color: tab === id ? "var(--color-accent)" : "var(--color-muted)",
                borderBottom: tab === id ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
            >
              {id === "proof" ? "Compliance" : id}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "deposit" && <DepositView onDone={loadNotes} />}
        {tab === "withdraw" && <WithdrawView notes={notes} wallet={wallet} onDone={loadNotes} />}
        {tab === "proof" && <ComplianceView />}

        {/* Notes list */}
        {notes.length > 0 && (
          <div>
            <p class="card-label" style={{ padding: "4px 0 8px" }}>Notes</p>
            {notes.map((note, i) => (
              <div key={i} class="list-item">
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: note.spent ? "var(--color-border)" : "#fff7ed",
                  color: note.spent ? "var(--color-muted)" : "var(--color-accent)",
                }}>
                  {note.spent ? "✗" : "◈"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display: "flex", justifyContent: "space-between" }}>
                    <span>{note.spent ? "Spent" : "Active"}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{note.amount ?? note.value ?? "?"} DILI</span>
                  </div>
                  <div class="text-mono" style={{ fontSize: 10, color: "var(--color-muted)" }}>
                    {truncate(note.commitment, 24)}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--color-muted)", textAlign: "right" }}>
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
