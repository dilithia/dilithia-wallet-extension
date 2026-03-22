import { useState } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";

// ── From original: downloadJsonFile ──────────────────────────────────

function downloadJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ── SVG Icons ────────────────────────────────────────────────────────

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Recovery Screen ──────────────────────────────────────────────────

export function RecoveryScreen({ wallet, recovery, onDone, onSetRecovery, onBack }) {
  const [exporting, setExporting] = useState(false);
  const mnemonic = recovery?.mnemonic ?? "";
  const words = mnemonic.split(/\s+/).filter(Boolean);
  const needsAck = recovery?.acknowledged !== true;

  // Export wallet file — from original exportWalletFileButton handler
  const handleExport = async () => {
    if (!wallet || !mnemonic) return;
    setExporting(true);
    try {
      const address = String(wallet.address ?? "wallet").replace(/[^a-zA-Z0-9_-]/g, "_");
      const backupPayload = {
        format: "dilithia-wallet-backup",
        version: 1,
        exported_at: new Date().toISOString(),
        wallet: {
          mode: wallet.mode ?? null,
          algorithm: wallet.algorithm ?? null,
          address: wallet.address ?? null,
          public_key: wallet.publicKey ?? null,
          accounts: Array.isArray(wallet.accounts)
            ? wallet.accounts.map((a) => ({
                id: a.id ?? null,
                label: a.label ?? null,
                account_index: a.accountIndex ?? null,
                address: a.address ?? null,
                public_key: a.publicKey ?? a.public_key ?? null,
                secret_key: a.secretKey ?? a.secret_key ?? null,
              }))
            : [],
          active_account_id: wallet.activeAccountId ?? null,
          secret_key: wallet.secretKey ?? null,
        },
        recovery: {
          mnemonic,
          password_protected: Boolean(recovery?.passwordProtected),
          acknowledged: Boolean(recovery?.acknowledged),
        },
      };
      downloadJsonFile(`dilithia-wallet-backup-${address}.json`, backupPayload);
    } catch { /* ignore */ }
    setExporting(false);
  };

  // Mark backed up — from original markBackedUpButton handler
  const handleMarkDone = async () => {
    if (onSetRecovery) {
      await onSetRecovery({ ...recovery, acknowledged: true });
    }
    // Also update wallet.recovery.acknowledged
    const walletData = await chrome.storage.local.get("dilithia.wallet");
    const w = walletData["dilithia.wallet"];
    if (w?.recovery?.mnemonic) {
      await chrome.storage.local.set({
        "dilithia.wallet": { ...w, recovery: { ...w.recovery, acknowledged: true } },
      });
    }
    if (onDone) onDone();
  };

  return (
    <div class="screen">
      <NavHeader title="Back up your wallet" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">

          {needsAck && (
            <p class="text-body text-center">
              Write down these {words.length} words in order. This is the only way to recover your wallet if you lose access.
            </p>
          )}

          {/* Mnemonic grid — from original renderMnemonicWords */}
          {needsAck && words.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5,
            }}>
              {words.map((word, i) => (
                <div key={i} class="card" style={{ padding: "5px 8px", fontSize: 11, lineHeight: "16px" }}>
                  <span style={{ color: "var(--color-muted)", marginRight: 4, fontSize: 10 }}>{i + 1}.</span>
                  {word}
                </div>
              ))}
            </div>
          )}

          {!needsAck && (
            <p class="text-body text-center" style={{ paddingTop: 24 }}>
              Your wallet has been backed up. You can export the wallet file at any time.
            </p>
          )}

          {/* Actions */}
          <div class="stack stack-sm">
            {needsAck && (
              <button class="btn btn-subtle" onClick={handleExport} disabled={exporting} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <DownloadIcon />
                Export Wallet File
              </button>
            )}

            <button class="btn btn-primary" onClick={handleMarkDone} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CheckIcon />
              {needsAck ? "I Wrote It Down" : "Done"}
            </button>

            {!needsAck && (
              <button class="btn btn-subtle" onClick={handleExport} disabled={exporting} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <DownloadIcon />
                Export Wallet File
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
