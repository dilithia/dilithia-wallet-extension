import { useState, useCallback } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";
import { PromptDialog, ConfirmDialog } from "../components/Dialog.jsx";
import { truncateAddress } from "../lib/format.js";
import { makeAccountRecord, getWalletAccounts, syncWalletToActiveAccount } from "../lib/wallet-model.js";

// ── SVG Icons ────────────────────────────────────────────────────────

const DotsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 5.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm0 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm0 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// ── Account Row ──────────────────────────────────────────────────────

function AccountRow({ account, isActive, onSelect, onRename, onDelete, canDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: "var(--radius)",
      border: isActive ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
      background: isActive ? "#fff7ed" : "transparent",
    }}>
      {/* Main area — click to switch */}
      <button
        onClick={() => onSelect(account)}
        style={{
          display: "flex", alignItems: "center", gap: 12, flex: 1,
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left", font: "inherit", padding: 0, minWidth: 0,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: "var(--color-accent)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 14,
        }}>
          {account.accountIndex + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{account.label}</div>
          <div class="text-mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>
            {isActive ? "Active" : truncateAddress(account.address)}
          </div>
        </div>
        {isActive && <CheckIcon />}
      </button>

      {/* Menu button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: "var(--color-muted)", borderRadius: 4,
          }}
          aria-label="Account options"
        >
          <DotsIcon />
        </button>

        {menuOpen && (
          <div style={{
            position: "absolute", right: 0, top: "100%", zIndex: 10,
            background: "#fff", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            minWidth: 140, overflow: "hidden",
          }}>
            <button
              onClick={() => { setMenuOpen(false); onRename(account); }}
              style={{
                display: "block", width: "100%", padding: "10px 14px",
                background: "none", border: "none", cursor: "pointer",
                textAlign: "left", font: "inherit", fontSize: 13,
              }}
            >
              Rename
            </button>
            {canDelete && (
              <button
                onClick={() => { setMenuOpen(false); onDelete(account); }}
                style={{
                  display: "block", width: "100%", padding: "10px 14px",
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", font: "inherit", fontSize: 13,
                  color: "var(--color-error)",
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Accounts Screen ─────────────────────────────────────────────

export function AccountsScreen({ wallet, onBack, onSwitch }) {
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Dialog state
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null); // { purpose: "create" | "switch", account? }

  const accounts = getWalletAccounts(wallet);
  const activeId = wallet?.activeAccountId ?? accounts[0]?.id;

  // Switch account
  const handleSelect = useCallback(async (account) => {
    if (account.id === activeId) { onBack(); return; }
    try {
      const nextWallet = syncWalletToActiveAccount({ ...wallet, activeAccountId: account.id });
      await chrome.storage.local.set({ "dilithia.wallet": nextWallet });
      if (onSwitch) onSwitch();
      onBack();
    } catch (e) {
      setError(e.message ?? "Failed to switch");
    }
  }, [wallet, activeId, onBack, onSwitch]);

  // Rename (via dialog)
  const doRename = useCallback(async (nextName) => {
    if (!renameTarget) return;
    const nextAccounts = accounts.map((a) => a.id === renameTarget.id ? { ...a, label: nextName } : a);
    const nextWallet = syncWalletToActiveAccount({ ...wallet, accounts: nextAccounts });
    await chrome.storage.local.set({ "dilithia.wallet": nextWallet });
    setRenameTarget(null);
  }, [wallet, accounts, renameTarget]);

  // Delete (via dialog)
  const doDelete = useCallback(async () => {
    if (!deleteTarget || accounts.length <= 1) return;
    const remaining = accounts.filter((a) => a.id !== deleteTarget.id);
    const nextWallet = syncWalletToActiveAccount({
      ...wallet,
      accounts: remaining,
      activeAccountId: deleteTarget.id === activeId ? remaining[0]?.id ?? null : wallet.activeAccountId,
    });
    await chrome.storage.local.set({ "dilithia.wallet": nextWallet });
    setDeleteTarget(null);
  }, [wallet, accounts, activeId, deleteTarget]);

  // Create new HD account
  const handleCreate = useCallback(async (password) => {
    setCreating(true);
    setError(null);
    try {
      const recoveryData = await chrome.storage.local.get("dilithia.walletRecovery");
      const rec = recoveryData["dilithia.walletRecovery"];
      const mnemonic = wallet?.recovery?.mnemonic ?? rec?.mnemonic ?? "";
      if (!mnemonic) {
        setError("Recovery phrase required to derive a new account.");
        setCreating(false);
        return;
      }

      const passwordProtected = Boolean(wallet?.recovery?.passwordProtected ?? rec?.passwordProtected);
      if (passwordProtected && !password) {
        setPasswordTarget({ purpose: "create" });
        setCreating(false);
        return;
      }

      const nextIndex = Math.max(0, ...accounts.map((a) => Number(a.accountIndex ?? 0))) + 1;
      const { getCryptoBackend } = await import("../../lib/crypto-backend.js");
      const backend = await getCryptoBackend();
      const created = await backend.createAccountFromMnemonic(mnemonic, password ?? "", nextIndex);

      const nextAccount = makeAccountRecord({
        ...created,
        address: created.address,
        publicKey: created.public_key ?? created.publicKey,
        secretKey: created.secret_key ?? created.secretKey,
        walletFile: created.wallet_file ?? created.walletFile,
        label: `Account ${nextIndex + 1}`,
      }, nextIndex);

      const nextWallet = syncWalletToActiveAccount({
        ...wallet,
        accounts: [...accounts, nextAccount],
        activeAccountId: nextAccount.id,
      });
      await chrome.storage.local.set({ "dilithia.wallet": nextWallet });
      if (onSwitch) onSwitch();
      onBack();
    } catch (e) {
      setError(e.message ?? "Failed to create account");
    }
    setCreating(false);
  }, [wallet, accounts, onBack, onSwitch]);

  return (
    <div class="screen">
      <NavHeader title="Accounts" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-md">
          <p class="text-body">
            Accounts are derived from your recovery phrase. Switch by tapping, or use the menu to rename and delete.
          </p>

          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              isActive={account.id === activeId}
              onSelect={handleSelect}
              onRename={(acct) => setRenameTarget(acct)}
              onDelete={(acct) => accounts.length > 1 ? setDeleteTarget(acct) : setError("Cannot delete the only account.")}
              canDelete={accounts.length > 1}
            />
          ))}

          {error && <p class="text-error">{error}</p>}

          <button class="btn btn-subtle" onClick={handleCreate} disabled={creating} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <PlusIcon />
            {creating ? "Deriving..." : "Add Account"}
          </button>

        </div>
      </div>

      {/* Rename dialog */}
      <PromptDialog
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Account"
        label="Account name"
        placeholder="Account name"
        defaultValue={renameTarget?.label ?? ""}
        buttonLabel="Rename"
        onSubmit={(val) => doRename(val)}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete Account"
        message={`Delete ${deleteTarget?.label ?? "this account"}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      {/* Password dialog for create/switch */}
      <PromptDialog
        open={!!passwordTarget}
        onClose={() => setPasswordTarget(null)}
        title="Enter Password"
        label="Your password is needed to derive a new account."
        placeholder="Password"
        buttonLabel="Continue"
        onSubmit={(val) => {
          setPasswordTarget(null);
          if (passwordTarget?.purpose === "create") handleCreate(val);
        }}
      />
    </div>
  );
}
