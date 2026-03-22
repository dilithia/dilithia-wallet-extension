import { useState, useEffect } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";
import { AccountPicker } from "../components/AccountPicker.jsx";
import { TxStatus } from "../components/TxStatus.jsx";
import { useOverview } from "../hooks/useOverview.js";
import { truncateAddress } from "../lib/format.js";

// ── Helpers ──────────────────────────────────────────────────────────

function canonicalPayloadJson(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function truncateHash(h) {
  if (!h || h.length < 18) return h ?? "";
  return `${h.slice(0, 14)}…`;
}

// ── SVG Icons ────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

// ── Asset Picker ─────────────────────────────────────────────────────

function AssetPicker({ assets, onSelect }) {
  const [tab, setTab] = useState("tokens");
  const [search, setSearch] = useState("");

  const list = tab === "nfts" ? (assets.nfts ?? []) : (assets.tokens ?? []);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? list.filter((a) => [a.title, a.subtitle, a.symbol, a.contract, a.tokenId].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
    : list;

  return (
    <div class="stack stack-sm" style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 12 }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
        {["tokens", "nfts"].map((id) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "8px 0", background: "none", border: "none", cursor: "pointer",
            font: "inherit", fontWeight: 600, fontSize: 12, textTransform: "capitalize",
            color: tab === id ? "var(--color-accent)" : "var(--color-muted)",
            borderBottom: tab === id ? "2px solid var(--color-accent)" : "2px solid transparent",
          }}>{id}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SearchIcon />
        <input class="input" style={{ fontSize: 13, padding: "8px 10px" }} placeholder="Search assets" value={search} onInput={(e) => setSearch(e.target.value)} />
      </div>
      <div style={{ maxHeight: 140, overflowY: "auto" }}>
        {filtered.length === 0 && <p class="text-body text-center" style={{ fontSize: 12, padding: 8 }}>No {tab}</p>}
        {filtered.map((asset) => (
          <button key={asset.key} onClick={() => onSelect(asset)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", width: "100%",
            background: "none", border: "none", cursor: "pointer", textAlign: "left", font: "inherit",
          }}>
            <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{asset.title}</span>
            <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{asset.balance ?? ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Recipient selector button ────────────────────────────────────────

function RecipientButton({ recipient, onClick }) {
  if (!recipient) {
    return (
      <button onClick={onClick} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "12px 14px",
        border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
        background: "var(--color-bg)", cursor: "pointer", font: "inherit", fontSize: 14,
        color: "var(--color-muted)",
      }}>
        <span>Select recipient</span>
        <ChevronDown />
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
        background: recipient.external ? "#f5f0eb" : "var(--color-accent)",
        color: recipient.external ? "var(--color-muted)" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 11,
      }}>
        {recipient.external ? "→" : (recipient.accountIndex ?? 0) + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{recipient.label}</div>
        {!recipient.external && (
          <div class="text-mono" style={{ fontSize: 10, color: "var(--color-muted)" }}>{truncateAddress(recipient.address)}</div>
        )}
      </div>
      <ChevronDown />
    </button>
  );
}

// ── Send Screen ──────────────────────────────────────────────────────

export function SendScreen({ wallet, onBack }) {
  const [recipient, setRecipient] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [step, setStep] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const { overview } = useOverview(wallet?.address);

  const tokens = (overview?.tokenHoldings ?? []).map((item, i) => ({
    kind: "token", key: `token:${item.contract ?? item.symbol ?? i}`,
    title: item.symbol ?? item.contract ?? "Token",
    subtitle: item.contract ?? "", balance: item.balance ?? 0,
    symbol: item.symbol ?? "", contract: item.contract ?? "token",
  }));
  const nfts = (overview?.nftHoldings ?? []).map((item, i) => ({
    kind: "nft", key: `nft:${item.contract ?? "nft"}:${item.token_id ?? item.id ?? i}`,
    title: item.name ?? item.collection ?? item.contract ?? "NFT",
    subtitle: item.contract ?? "", balance: item.balance ?? 1,
    symbol: item.collection ?? "", contract: item.contract ?? "",
    tokenId: item.token_id ?? item.id ?? "",
  }));

  useEffect(() => {
    if (!selectedAsset && tokens.length > 0) setSelectedAsset(tokens[0]);
  }, [tokens.length]);

  // ── 4-step send flow ───────────────────────────────────────────────

  const handleSend = async () => {
    const to = recipient?.address;
    if (!to) { setStatus({ error: "Select a recipient" }); return; }
    if (!amount.trim()) { setStatus({ error: "Enter an amount" }); return; }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) { setStatus({ error: "Amount must be positive" }); return; }
    if (!wallet?.address || !wallet.publicKey || !wallet.secretKey) { setStatus({ error: "Wallet not available" }); return; }

    setBusy(true);
    setStatus(null);

    try {
      const settingsData = await chrome.storage.local.get("dilithia.settings");
      const settings = settingsData["dilithia.settings"] ?? {};
      const rpcUrl = settings.rpcUrl ?? "http://127.0.0.1:8000/rpc";
      const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");

      const contract = selectedAsset?.contract ?? "token";
      const method = selectedAsset?.kind === "nft" ? "transfer_nft" : "transfer";
      const args = selectedAsset?.kind === "nft"
        ? { to, token_id: selectedAsset.tokenId }
        : { to, amount: amountNum };

      setStep("1/4 Simulating...");
      const nonceRes = await fetch(`${baseUrl}/nonce/${encodeURIComponent(wallet.address)}`).then((r) => r.json());
      const nonce = Number(nonceRes?.next_nonce ?? 0);
      const call = { from: wallet.address, contract, method, args };

      const simRes = await fetch(`${baseUrl}/simulate`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(call),
      }).then((r) => r.json());

      if (!simRes?.success) throw new Error(`Simulation failed: ${simRes?.error ?? "unknown"}`);

      setStep(`2/4 Simulation OK · gas ${simRes.gas_used ?? 0}`);
      setStep("3/4 Signing...");

      const canonical = { from: wallet.address, nonce, chain_id: settings.chainId, contract, method, args };
      const payloadJson = canonicalPayloadJson(canonical);
      const { signMessage } = await import("../../lib/wallet.js");
      const signed = await signMessage(wallet, payloadJson);

      setStep("4/4 Submitting...");
      const submitRes = await fetch(`${baseUrl}/call`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...call, alg: signed.algorithm, pk: wallet.publicKey, sig: signed.signature, nonce, chain_id: settings.chainId, version: 1 }),
      }).then((r) => r.json());

      const txHash = submitRes?.tx_hash ?? submitRes?.txHash;
      if (txHash) {
        let receipt = null;
        for (let i = 0; i < 12; i++) {
          try {
            const r = await fetch(`${baseUrl}/receipt/${encodeURIComponent(txHash)}`, { cache: "no-store" });
            if (r.ok) { receipt = await r.json(); break; }
          } catch { /* retry */ }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        const ok = receipt?.status === "ok" || receipt?.status === "confirmed";
        setStatus({ success: `${ok ? "Confirmed" : receipt?.status ?? "Submitted"} · ${truncateHash(txHash)}` });
      } else {
        setStatus({ success: "Transaction submitted." });
      }

      setRecipient(null);
      setAmount("");
      setStep(null);
    } catch (e) {
      setStatus({ error: e.message ?? "Send failed" });
      setStep(null);
    }
    setBusy(false);
  };

  return (
    <div class="screen">
      <NavHeader title="Send" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-md" style={{ maxWidth: 320, margin: "0 auto" }}>

          {/* Asset */}
          <div class="field">
            <label class="field-label">Asset</label>
            <button onClick={() => setAssetPickerOpen(!assetPickerOpen)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "12px 14px",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
              background: "var(--color-bg)", cursor: "pointer", font: "inherit", fontSize: 14,
            }}>
              <span>{selectedAsset?.title ?? "Select asset"}</span>
              <ChevronDown />
            </button>
            {selectedAsset && (
              <span class="text-body" style={{ fontSize: 12 }}>Balance: {selectedAsset.balance ?? 0} {selectedAsset.symbol}</span>
            )}
          </div>

          {assetPickerOpen && (
            <AssetPicker assets={{ tokens, nfts }} onSelect={(asset) => { setSelectedAsset(asset); setAssetPickerOpen(false); }} />
          )}

          {/* Recipient — account picker */}
          <div class="field">
            <label class="field-label">To</label>
            <RecipientButton recipient={recipient} onClick={() => setPickerOpen(true)} />
          </div>

          {/* Amount */}
          {selectedAsset?.kind !== "nft" && (
            <div class="field">
              <label class="field-label">Amount</label>
              <input class="input" type="text" inputMode="decimal" placeholder="0" style={{ textAlign: "right" }} value={amount} onInput={(e) => setAmount(e.target.value)} />
            </div>
          )}

          {/* Status */}
          <TxStatus step={step} status={status} />

          <button class="btn btn-primary" onClick={handleSend} disabled={busy}>
            {busy ? step ?? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Account picker dialog */}
      <AccountPicker
        wallet={wallet}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(account) => { setRecipient(account); setPickerOpen(false); }}
        allowExternal={true}
        excludeAddress={wallet?.address}
      />
    </div>
  );
}
