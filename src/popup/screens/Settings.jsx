import { useState, useEffect, useCallback } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";

const SETTINGS_KEY = "dilithia.settings";
const LOCK_KEY = "dilithia.lockConfig";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
  { value: "zh", label: "中文" },
  { value: "hi", label: "हिन्दी" },
  { value: "ar", label: "العربية" },
  { value: "bn", label: "বাংলা" },
  { value: "ru", label: "Русский" },
  { value: "ja", label: "日本語" },
  { value: "de", label: "Deutsch" },
  { value: "ko", label: "한국어" },
];

// ── SVG ──────────────────────────────────────────────────────────────

const Chevron = () => (
  <svg class="settings-row-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6" /></svg>
);

// Row icons
const NetworkIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>);
const ServicesIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const SecurityIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const GeneralIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9" /></svg>);
const EyeOffIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>);
const LockIcon = () => (<svg viewBox="0 0 100 100" width="20" height="20" fill="var(--color-error)"><path d="M49 1.9c-8 .3-17 3.5-24 9.1-7 6-5 26-5 26H10v42c0 16 12 19 21 19h39c12 0 22-8 22-17V37H82s2-18-4-24C70 5.5 61 2 51 1.9zm1 7.7c8-.1 16 2.4 21 8.4 3 4 3 19 3 19H28s-1-16 3-20c4-5 11-7.2 19-7.4M50 49c3 0 6 1 8 4 4 6-3 12-3 12l5 20H41l5-20s-1-1-3-4c-2-4-1-7 2-10 1-1 3-2 5-2" /></svg>);

function Row({ Icon, label, value, onClick, danger }) {
  return (
    <button class="settings-row" onClick={onClick} style={danger ? { color: "var(--color-error)" } : undefined}>
      {Icon && <span style={{ flexShrink: 0 }}><Icon /></span>}
      <span class="settings-row-label">{label}</span>
      {value !== undefined && <span class="settings-row-value">{value}</span>}
      <Chevron />
    </button>
  );
}

function SimpleRow({ label, value, onClick }) {
  return (
    <button class="settings-row" onClick={onClick}>
      <span class="settings-row-label">{label}</span>
      {value !== undefined && <span class="settings-row-value">{value}</span>}
      <Chevron />
    </button>
  );
}

// ── Field edit screen ────────────────────────────────────────────────

function EditFieldScreen({ title, label, description, value, placeholder, onSave, onBack }) {
  const [val, setVal] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await onSave(val.trim()); setSaving(false); onBack(); };
  return (
    <div class="screen"><NavHeader title={title} onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-lg">
        <div class="field"><label class="field-label">{label}</label><input class="input" value={val} onInput={(e) => setVal(e.target.value)} placeholder={placeholder ?? ""} /></div>
        {description && <p class="text-body" style={{ fontSize: 12 }}>{description}</p>}
        <button class="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      </div></div>
    </div>
  );
}

// ── Pick list screen ─────────────────────────────────────────────────

function PickScreen({ title, options, current, onSelect, onBack }) {
  return (
    <div class="screen"><NavHeader title={title} onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-sm">
        {options.map((opt) => (
          <button key={opt.value} class="settings-row" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }} onClick={() => { onSelect(opt.value); onBack(); }}>
            <span class="settings-row-label">{opt.label}</span>
            {current === opt.value && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </button>
        ))}
      </div></div>
    </div>
  );
}

// ── Network sub-screen ───────────────────────────────────────────────

function SelectNetworkScreen({ settings, networks, onSave, onBack }) {
  const [networkId, setNetworkId] = useState(settings?.networkId ?? "");
  const [rpcUrl, setRpcUrl] = useState(settings?.rpcUrl ?? "");
  const [chainId, setChainId] = useState(settings?.chainId ?? "");
  const [peers, setPeers] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sel = networks.find((n) => n.id === networkId);
    if (sel) { setPeers(Array.isArray(sel.bootstrap_peers) ? sel.bootstrap_peers.join("\n") : ""); }
  }, [networkId, networks]);

  const handleNetworkChange = (id) => { setNetworkId(id); const s = networks.find((n) => n.id === id); if (s) { setRpcUrl(s.rpc_endpoints?.[0] ?? ""); setChainId(s.chain_id ?? ""); } };
  const handleSave = async () => { setSaving(true); await onSave({ networkId, rpcUrl: rpcUrl.trim(), rpcUrlSource: "manual", chainId: chainId.trim(), chainIdSource: "manual" }); setSaving(false); onBack(); };

  return (
    <div class="screen"><NavHeader title="Select Network" onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-lg">
        <div class="field"><label class="field-label">Network</label><select class="input" value={networkId} onChange={(e) => handleNetworkChange(e.target.value)}>{networks.length === 0 && <option value="">No networks</option>}{networks.map((n) => <option key={n.id} value={n.id}>{n.label} ({n.chain_id})</option>)}</select></div>
        <div class="field"><label class="field-label">RPC URL</label><input class="input" value={rpcUrl} onInput={(e) => setRpcUrl(e.target.value)} /></div>
        <div class="field"><label class="field-label">Chain ID</label><input class="input" value={chainId} onInput={(e) => setChainId(e.target.value)} /></div>
        {peers && <div class="field"><label class="field-label">Bootstrap Peers</label><textarea class="input" rows={3} readOnly value={peers} style={{ fontSize: 11, fontFamily: "var(--font-mono)" }} /></div>}
        <button class="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      </div></div>
    </div>
  );
}

function NetworkScreen({ settings, onSave, onBack }) {
  const [sub, setSub] = useState(null);
  const [registryUrl, setRegistryUrl] = useState(settings?.networkRegistryUrl ?? "");
  const [networks, setNetworks] = useState([]);
  const [status, setStatus] = useState("");
  const truncVal = (v) => { const s = String(v ?? ""); return s.length > 24 ? `${s.slice(0, 22)}…` : s; };

  const loadRegistry = useCallback(async () => {
    try {
      const { fetchNetworkRegistry, getPreferredRpcEndpoint } = await import("../../lib/network-registry.js");
      const result = await fetchNetworkRegistry({ ...settings, networkRegistryUrl: registryUrl.trim() });
      setNetworks(result?.registry?.networks ?? []);
      setStatus("");
    } catch (e) { setStatus(e.message ?? "Registry error"); }
  }, [settings, registryUrl]);

  useEffect(() => { loadRegistry(); }, []);

  if (sub === "select") return <SelectNetworkScreen settings={settings} networks={networks} onSave={async (patch) => { await onSave({ ...patch, networkRegistryUrl: registryUrl.trim() }); }} onBack={() => setSub(null)} />;

  return (
    <div class="screen"><NavHeader title="Network" onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-md" style={{ paddingTop: 4 }}>
        <div class="field">
          <label class="field-label">Registry URL</label>
          <input class="input" value={registryUrl} onInput={(e) => setRegistryUrl(e.target.value)} placeholder="Optional" />
          <button class="btn btn-subtle" onClick={loadRegistry} style={{ marginTop: 6, fontSize: 13 }}>Refresh</button>
          {status && <p class="text-error" style={{ fontSize: 12 }}>{status}</p>}
        </div>
        <div class="settings-group">
          <SimpleRow label="Select Network" value={settings.network?.label ?? settings.networkId ?? "Local"} onClick={() => setSub("select")} />
        </div>
        <div style={{ padding: "4px" }}>
          <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
            <div><strong>RPC:</strong> <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{truncVal(settings.rpcUrl)}</span></div>
            <div style={{ marginTop: 4 }}><strong>Chain:</strong> {settings.chainId ?? "—"}</div>
          </div>
        </div>
      </div></div>
    </div>
  );
}

// ── Services sub-screen ──────────────────────────────────────────────

function ServicesScreen({ settings, onSave, onBack }) {
  const [sub, setSub] = useState(null);
  const truncVal = (v) => { const s = String(v ?? ""); return s.length > 20 ? `${s.slice(0, 18)}…` : s; };

  if (sub === "paymaster") return <EditFieldScreen title="Gas Sponsor" label="Default Paymaster" description="Contract address for gas sponsorship. Leave empty to pay gas yourself." value={settings.defaultPaymaster ?? ""} placeholder="dili1_paymaster_addr" onSave={(v) => onSave({ defaultPaymaster: v })} onBack={() => setSub(null)} />;
  if (sub === "oracle") return <EditFieldScreen title="Oracle" label="Oracle Adapter URL" description="URL or contract of the oracle adapter for price feeds." value={settings.oracleUrl ?? ""} placeholder="https://oracle.dilithia.network" onSave={(v) => onSave({ oracleUrl: v })} onBack={() => setSub(null)} />;
  if (sub === "swap") return <EditFieldScreen title="Swap Service" label="Swap Contract / URL" description="Allowed swap service for token exchanges. Used by the Swap action." value={settings.swapService ?? ""} placeholder="dili1_swap_contract or URL" onSave={(v) => onSave({ swapService: v })} onBack={() => setSub(null)} />;

  return (
    <div class="screen"><NavHeader title="Services" onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-md" style={{ paddingTop: 4 }}>
        <div class="settings-group">
          <SimpleRow label="Gas Sponsor" value={settings.defaultPaymaster ? truncVal(settings.defaultPaymaster) : "None"} onClick={() => setSub("paymaster")} />
          <SimpleRow label="Oracle" value={settings.oracleUrl ? truncVal(settings.oracleUrl) : "None"} onClick={() => setSub("oracle")} />
          <SimpleRow label="Swap Service" value={settings.swapService ? truncVal(settings.swapService) : "None"} onClick={() => setSub("swap")} />
        </div>
      </div></div>
    </div>
  );
}

// ── Security sub-screen ──────────────────────────────────────────────

function SecurityScreen({ settings, lockConfig, onSaveLock, onBack, onRecovery, onConnectedSites }) {
  const [sub, setSub] = useState(null);

  if (sub === "autolock") return <PickScreen title="Auto-lock" current={lockConfig?.autoLockMinutes ?? 15} options={[
    { value: 1, label: "1 minute" }, { value: 5, label: "5 minutes" }, { value: 15, label: "15 minutes" }, { value: 30, label: "30 minutes" }, { value: 60, label: "1 hour" },
  ]} onSelect={(v) => onSaveLock({ autoLockMinutes: v })} onBack={() => setSub(null)} />;

  return (
    <div class="screen"><NavHeader title="Security" onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-md" style={{ paddingTop: 4 }}>
        <div class="settings-group">
          <SimpleRow label="Auto-lock" value={`${lockConfig?.autoLockMinutes ?? 15} min`} onClick={() => setSub("autolock")} />
          <SimpleRow label="Back Up Recovery Phrase" onClick={onRecovery} />
          {onConnectedSites && <SimpleRow label="Manage Permissions" onClick={onConnectedSites} />}
        </div>
      </div></div>
    </div>
  );
}

// ── General sub-screen ───────────────────────────────────────────────

function GeneralScreen({ settings, onSave, onBack, onAccounts }) {
  const [sub, setSub] = useState(null);
  const langLabel = LANGUAGES.find((l) => l.value === settings.locale)?.label ?? "English";

  if (sub === "language") return <PickScreen title="Language" current={settings.locale ?? "en"} options={LANGUAGES} onSelect={(v) => onSave({ locale: v })} onBack={() => setSub(null)} />;

  return (
    <div class="screen"><NavHeader title="General" onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-md" style={{ paddingTop: 4 }}>
        <div class="settings-group">
          <SimpleRow label="Language" value={langLabel} onClick={() => setSub("language")} />
          {onAccounts && <SimpleRow label="Manage Accounts" onClick={onAccounts} />}
        </div>
      </div></div>
    </div>
  );
}

// ── Main Settings (level 1 — categories only) ────────────────────────

const CURRENCIES = [
  { value: "DILI", label: "DILI" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
  { value: "JPY", label: "¥ JPY" },
  { value: "CNY", label: "¥ CNY" },
  { value: "KRW", label: "₩ KRW" },
  { value: "BRL", label: "R$ BRL" },
];

const PowerIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>);

const HIDDEN_ASSETS_KEY = "dilithia.hiddenAssets";

function HiddenAssetsScreen({ address, onBack }) {
  const [hidden, setHidden] = useState({ tokens: [], nfts: [] });

  useEffect(() => {
    chrome.storage.local.get(HIDDEN_ASSETS_KEY).then((data) => {
      const all = data[HIDDEN_ASSETS_KEY] ?? {};
      setHidden(all[address] ?? { tokens: [], nfts: [] });
    });
    const listener = (changes, area) => {
      if (area === "local" && changes[HIDDEN_ASSETS_KEY]) {
        const all = changes[HIDDEN_ASSETS_KEY].newValue ?? {};
        setHidden(all[address] ?? { tokens: [], nfts: [] });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [address]);

  const restore = (type, contract) => {
    chrome.storage.local.get(HIDDEN_ASSETS_KEY).then((data) => {
      const all = data[HIDDEN_ASSETS_KEY] ?? {};
      const entry = all[address] ?? { tokens: [], nfts: [] };
      entry[type] = entry[type].filter((c) => c !== contract);
      all[address] = entry;
      chrome.storage.local.set({ [HIDDEN_ASSETS_KEY]: all });
    });
  };

  const restoreAll = () => {
    chrome.storage.local.get(HIDDEN_ASSETS_KEY).then((data) => {
      const all = data[HIDDEN_ASSETS_KEY] ?? {};
      delete all[address];
      chrome.storage.local.set({ [HIDDEN_ASSETS_KEY]: all });
    });
  };

  const total = hidden.tokens.length + hidden.nfts.length;

  return (
    <div class="screen"><NavHeader title="Hidden Assets" onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-lg" style={{ paddingTop: 8 }}>
        {total === 0 ? (
          <p class="text-body text-center" style={{ padding: "32px 0", color: "var(--color-muted)" }}>No hidden assets</p>
        ) : (
          <>
            {hidden.tokens.length > 0 && (
              <div class="settings-group">
                <div style={{ padding: "8px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)" }}>Tokens</div>
                {hidden.tokens.map((contract) => (
                  <button key={contract} class="settings-row" onClick={() => restore("tokens", contract)}>
                    <span class="settings-row-label text-mono" style={{ fontSize: 12 }}>{contract.slice(0, 12)}...{contract.slice(-8)}</span>
                    <span style={{ fontSize: 12, color: "var(--color-accent)", fontWeight: 600 }}>Restore</span>
                  </button>
                ))}
              </div>
            )}
            {hidden.nfts.length > 0 && (
              <div class="settings-group">
                <div style={{ padding: "8px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)" }}>NFTs</div>
                {hidden.nfts.map((contract) => (
                  <button key={contract} class="settings-row" onClick={() => restore("nfts", contract)}>
                    <span class="settings-row-label text-mono" style={{ fontSize: 12 }}>{contract.slice(0, 12)}...{contract.slice(-8)}</span>
                    <span style={{ fontSize: 12, color: "var(--color-accent)", fontWeight: 600 }}>Restore</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ textAlign: "center", paddingTop: 16 }}>
              <button onClick={restoreAll} style={{
                background: "none", border: "none", cursor: "pointer",
                font: "inherit", fontSize: 13, fontWeight: 500, color: "var(--color-accent)",
              }}>Restore All ({total})</button>
            </div>
          </>
        )}
      </div></div>
    </div>
  );
}

export function SettingsScreen({ onBack, onLock, onLogout, onRecovery, onConnectedSites, onAccounts, wallet }) {
  const [settings, setSettingsState] = useState(null);
  const [lockConfig, setLockConfigState] = useState(null);
  const [sub, setSub] = useState(null);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    chrome.storage.local.get([SETTINGS_KEY, LOCK_KEY]).then((data) => {
      setSettingsState(data[SETTINGS_KEY] ?? {});
      setLockConfigState(data[LOCK_KEY] ?? {});
    });
  }, []);

  const saveSettings = useCallback(async (patch) => {
    const next = { ...settings, ...patch };
    await chrome.storage.local.set({ [SETTINGS_KEY]: next });
    setSettingsState(next);
  }, [settings]);

  const saveLock = useCallback(async (patch) => {
    const next = { ...lockConfig, ...patch };
    await chrome.storage.local.set({ [LOCK_KEY]: next });
    setLockConfigState(next);
  }, [lockConfig]);

  if (!settings) return <div class="screen"><NavHeader title="Settings" onBack={onBack} /><div class="screen-centered"><p class="text-body">Loading...</p></div></div>;

  // Level 2 screens
  if (sub === "network") return <NetworkScreen settings={settings} onSave={saveSettings} onBack={() => setSub(null)} />;
  if (sub === "services") return <ServicesScreen settings={settings} onSave={saveSettings} onBack={() => setSub(null)} />;
  if (sub === "security") return <SecurityScreen settings={settings} lockConfig={lockConfig} onSaveLock={saveLock} onBack={() => setSub(null)} onRecovery={onRecovery} onConnectedSites={onConnectedSites} />;
  if (sub === "general") return <GeneralScreen settings={settings} onSave={saveSettings} onBack={() => setSub(null)} onAccounts={onAccounts} />;
  if (sub === "currency") return <PickScreen title="Display Currency" current={settings.displayCurrency ?? "DILI"} options={CURRENCIES} onSelect={(v) => saveSettings({ displayCurrency: v })} onBack={() => setSub(null)} />;
  if (sub === "hidden-assets") return <HiddenAssetsScreen address={wallet?.address ?? ""} onBack={() => setSub(null)} />;

  // Level 1 — categories only (lock/logout in More tab)
  return (
    <div class="screen">
      <NavHeader title="Settings" onBack={onBack} />
      <div class="screen-scroll"><div class="stack stack-lg" style={{ paddingTop: 8 }}>
        <div class="settings-group">
          <Row Icon={NetworkIcon} label="Network" value={settings.network?.label ?? settings.networkId ?? ""} onClick={() => setSub("network")} />
          <Row Icon={ServicesIcon} label="Services" onClick={() => setSub("services")} />
          <Row Icon={SecurityIcon} label="Security" onClick={() => setSub("security")} />
          <Row Icon={GeneralIcon} label="General" onClick={() => setSub("general")} />
          <Row Icon={EyeOffIcon} label="Hidden Assets" onClick={() => setSub("hidden-assets")} />
        </div>
      </div></div>
    </div>
  );
}
