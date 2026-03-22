import { useState } from "preact/hooks";
import { ConfirmDialog } from "../components/Dialog.jsx";

// ── SVG Icons ────────────────────────────────────────────────────────

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const KeyIcon = () => (
  <svg viewBox="0 0 16 16" width="20" height="20" fill="var(--color-accent)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.351 1.091a4.53 4.53 0 0 1 3.44 3.16c.215.724.247 1.49.093 2.23a4.58 4.58 0 0 1-4.437 3.6c-.438 0-.874-.063-1.293-.19l-.8.938-.379.175H7v1.5l-.5.5H5v1.5l-.5.5h-3l-.5-.5v-2.307l.146-.353L6.12 6.87a4.5 4.5 0 0 1-.2-1.405 4.528 4.528 0 0 1 5.431-4.375zm1.318 7.2a3.57 3.57 0 0 0 1.239-2.005l.004.005A3.543 3.543 0 0 0 9.72 2.08a3.576 3.576 0 0 0-2.8 3.4c-.01.456.07.908.239 1.33l-.11.543L2 12.404v1.6h2v-1.5l.5-.5H6v-1.5l.5-.5h1.245l.876-1.016.561-.14a3.5 3.5 0 0 0 1.269.238 3.57 3.57 0 0 0 2.218-.795m-.838-2.732a1 1 0 1 0-1.662-1.11 1 1 0 0 0 1.662 1.11" />
  </svg>
);

const PrivacyIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IdentityIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 15a3 3 0 016 0" /><circle cx="11" cy="10" r="2" /><path d="M17 8h2M17 12h2" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 100 100" width="16" height="16">
    <path fill="currentColor" d="M49 1.9c-8 .3-17 3.5-24 9.1-7 6-5 26-5 26H10v42c0 16 12 19 21 19h39c12 0 22-8 22-17V37H82s2-18-4-24C70 5.5 61 2 51 1.9zm1 7.7c8-.1 16 2.4 21 8.4 3 4 3 19 3 19H28s-1-16 3-20c4-5 11-7.2 19-7.4M50 49c3 0 6 1 8 4 4 6-3 12-3 12l5 20H41l5-20s-1-1-3-4c-2-4-1-7 2-10 1-1 3-2 5-2"/>
  </svg>
);

const PowerIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style={{ color: "var(--color-muted)", flexShrink: 0 }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function MenuItem({ Icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 4px",
      background: "none", border: "none",
      cursor: "pointer", width: "100%", textAlign: "left", font: "inherit",
      color: "var(--color-text)",
    }}>
      <Icon />
      <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{label}</span>
      <Chevron />
    </button>
  );
}

export function MoreScreen({ onNavigate, onLock, onLogout }) {
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div class="screen-scroll" style={{ flex: 1 }}>
        <div style={{ paddingTop: 8 }}>
          <MenuItem Icon={SettingsIcon} label="Settings" onClick={() => onNavigate("settings")} />
          <MenuItem Icon={UsersIcon} label="Accounts" onClick={() => onNavigate("accounts")} />
          <MenuItem Icon={KeyIcon} label="Back Up Wallet" onClick={() => onNavigate("recovery")} />
          <MenuItem Icon={PrivacyIcon} label="Private Transfers" onClick={() => onNavigate("privacy")} />
          <MenuItem Icon={IdentityIcon} label="Identity" onClick={() => onNavigate("identity")} />
          <MenuItem Icon={UsersIcon} label="Multisig" onClick={() => onNavigate("multisig")} />
          <MenuItem Icon={GlobeIcon} label="Manage Permissions" onClick={() => onNavigate("connected-sites")} />
        </div>
      </div>

      {/* Lock / Logout — horizontal bar above the tab bar */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tr>
          <td style={{ width: "50%", padding: 0 }}>
            <button onClick={() => setLockConfirmOpen(true)} style={{
              width: "100%", padding: "12px 0", background: "none", border: "none",
              cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 600,
              color: "var(--color-error)", textAlign: "center",
            }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><LockIcon /> Lock</span>
            </button>
          </td>
          {onLogout && (
            <td style={{ width: "50%", padding: 0 }}>
              <button onClick={() => setLogoutConfirmOpen(true)} style={{
                width: "100%", padding: "12px 0", background: "none", border: "none",
                cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 600,
                color: "var(--color-error)", textAlign: "center",
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><PowerIcon /> Logout</span>
              </button>
            </td>
          )}
        </tr>
      </table>

      <ConfirmDialog open={lockConfirmOpen} onClose={() => setLockConfirmOpen(false)} onConfirm={() => { onLock(); setLockConfirmOpen(false); }} title="Lock" message="You'll need your password to unlock." confirmLabel="Lock" danger />
      {onLogout && <ConfirmDialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} onConfirm={() => { onLogout(); setLogoutConfirmOpen(false); }} title="Logout" message="This will remove your wallet from this device. Make sure you have your recovery phrase backed up." confirmLabel="Logout" danger />}
    </div>
  );
}
