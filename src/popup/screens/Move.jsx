import { useState } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";
import { AccountPicker } from "../components/AccountPicker.jsx";
import { TxStatus } from "../components/TxStatus.jsx";
import { getWalletAccounts } from "../lib/wallet-model.js";
import { truncateAddress } from "../lib/format.js";

// ── SVG Icons ────────────────────────────────────────────────────────

const SwapVertIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M7 4v16M7 20l-3-3m3 3l3-3M17 20V4m0 0l3 3m-3-3l-3 3" />
  </svg>
);

function AccountButton({ label, account, onClick, placeholder }) {
  if (!account) {
    return (
      <button onClick={onClick} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "12px 14px",
        border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
        background: "var(--color-bg)", cursor: "pointer", font: "inherit", fontSize: 14,
        color: "var(--color-muted)",
      }}>
        <span>{placeholder}</span>
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6l4 4 4-4" /></svg>
      </button>
    );
  }

  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
      border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
      background: "var(--color-bg)", cursor: "pointer", font: "inherit", textAlign: "left",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: "var(--color-accent)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 11,
      }}>
        {(account.accountIndex ?? 0) + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{account.label}</div>
        <div class="text-mono" style={{ fontSize: 10, color: "var(--color-muted)" }}>{truncateAddress(account.address)}</div>
      </div>
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--color-muted)" stroke-width="2" stroke-linecap="round"><path d="M4 6l4 4 4-4" /></svg>
    </button>
  );
}

// ── Move Screen ──────────────────────────────────────────────────────

export function MoveScreen({ wallet, onBack }) {
  const accounts = getWalletAccounts(wallet);
  const active = accounts.find((a) => a.id === wallet?.activeAccountId) ?? accounts[0];

  const [from, setFrom] = useState(active ?? null);
  const [to, setTo] = useState(null);
  const [amount, setAmount] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // "from" | "to" | null
  const [step, setStep] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleFlip = () => { setFrom(to); setTo(from); };

  const handleMove = async () => {
    if (!from?.address || !to?.address) { setStatus({ error: "Select both accounts" }); return; }
    if (from.address === to.address) { setStatus({ error: "From and To must be different" }); return; }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setStatus({ error: "Enter a valid amount" }); return; }

    setBusy(true);
    setStatus(null);

    try {
      if (isPrivate) {
        // Private move: deposit from → shielded pool → withdraw to
        setStep("approval");
        const depositRes = await chrome.runtime.sendMessage({
          type: "DILITHIA_PROVIDER_REQUEST",
          origin: "chrome-extension://popup",
          method: "dilithia_shieldedDeposit",
          params: { amount: n },
        });
        if (!depositRes?.ok) throw new Error(depositRes?.error ?? "Deposit failed");

        setStep("approval");
        const withdrawRes = await chrome.runtime.sendMessage({
          type: "DILITHIA_PROVIDER_REQUEST",
          origin: "chrome-extension://popup",
          method: "dilithia_shieldedWithdraw",
          params: { commitmentIndex: 0, amount: n, recipient: to.address },
        });
        if (!withdrawRes?.ok) throw new Error(withdrawRes?.error ?? "Withdraw failed");

        setStep(null);
        setStatus({ success: "Private transfer complete" });
      } else {
        // Direct move: token.transfer
        setStep("approval");
        const res = await chrome.runtime.sendMessage({
          type: "DILITHIA_PROVIDER_REQUEST",
          origin: "chrome-extension://popup",
          method: "dilithia_sendTransaction",
          params: {
            transaction: {
              contract: "token",
              method: "transfer",
              args: { to: to.address, amount: n },
            },
          },
        });
        if (!res?.ok) throw new Error(res?.error ?? "Transfer failed");
        setStep(null);
        setStatus({ success: `Moved · ${res.result?.tx_hash ?? res.result?.txHash ?? "done"}`.slice(0, 40) });
      }

      setAmount("");
    } catch (e) {
      setStatus({ error: e.message ?? "Move failed" });
      setStep(null);
    }
    setBusy(false);
  };

  return (
    <div class="screen">
      <NavHeader title="Move" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-md" style={{ maxWidth: 320, margin: "0 auto" }}>

          {/* From */}
          <div class="field">
            <label class="field-label">From</label>
            <AccountButton account={from} onClick={() => setPickerTarget("from")} placeholder="Select source account" />
          </div>

          {/* Flip */}
          <div class="text-center">
            <button onClick={handleFlip} style={{
              background: "var(--color-bg)", border: "2px solid var(--color-border)",
              borderRadius: "50%", width: 36, height: 36, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-accent)",
            }} aria-label="Flip">
              <SwapVertIcon />
            </button>
          </div>

          {/* To */}
          <div class="field">
            <label class="field-label">To</label>
            <AccountButton account={to} onClick={() => setPickerTarget("to")} placeholder="Select destination account" />
          </div>

          {/* Amount */}
          <div class="field">
            <label class="field-label">Amount</label>
            <input class="input" type="text" inputMode="decimal" placeholder="0" style={{ textAlign: "right" }} value={amount} onInput={(e) => setAmount(e.target.value)} />
          </div>

          {/* Private toggle */}
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: "var(--radius-sm)",
              border: isPrivate ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
              background: isPrivate ? "#fff7ed" : "transparent",
              cursor: "pointer", font: "inherit", width: "100%", textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, color: isPrivate ? "var(--color-accent)" : "var(--color-text)" }}>
                Private transfer
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                {isPrivate ? "Via shielded pool — amount hidden on-chain" : "Direct transfer — visible on-chain"}
              </div>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 11, padding: 2,
              background: isPrivate ? "var(--color-accent)" : "var(--color-border)",
              transition: "background 0.2s",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                transition: "transform 0.2s",
                transform: isPrivate ? "translateX(18px)" : "translateX(0)",
              }} />
            </div>
          </button>

          {/* Status */}
          <TxStatus step={step} status={status} />

          <button class="btn btn-primary" onClick={handleMove} disabled={busy}>
            {busy ? step ?? "Moving..." : isPrivate ? "Move Privately" : "Move"}
          </button>
        </div>
      </div>

      {/* Account picker */}
      <AccountPicker
        wallet={wallet}
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        onSelect={(account) => {
          if (pickerTarget === "from") setFrom(account);
          else setTo(account);
          setPickerTarget(null);
        }}
        allowExternal={false}
        excludeAddress={pickerTarget === "from" ? to?.address : from?.address}
      />
    </div>
  );
}
