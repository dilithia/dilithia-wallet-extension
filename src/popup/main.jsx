import { render } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { useSession } from "./hooks/useSession.js";
import { useWallet } from "./hooks/useWallet.js";
import { TabBar } from "./components/TabBar.jsx";
import { HomeHeader, NavHeader } from "./components/NavHeader.jsx";
import { LockScreen } from "./screens/Lock.jsx";
import { OnboardingScreen } from "./screens/Onboarding.jsx";
import { PasswordSetupScreen } from "./screens/PasswordSetup.jsx";
import { ImportMnemonicScreen } from "./screens/ImportMnemonic.jsx";
import { RecoveryScreen } from "./screens/Recovery.jsx";
import { HomeScreen } from "./screens/Home.jsx";
import { SendScreen } from "./screens/Send.jsx";
import { ReceiveScreen } from "./screens/Receive.jsx";
import { ActivityScreen } from "./screens/Activity.jsx";
import { SettingsScreen } from "./screens/Settings.jsx";
import { MoreScreen } from "./screens/More.jsx";
import { AccountsScreen } from "./screens/Accounts.jsx";
import { ShieldScreen } from "./screens/Shield.jsx";
import { SwapScreen } from "./screens/Swap.jsx";
import { ConnectedSitesScreen } from "./screens/ConnectedSites.jsx";
import { MoveScreen } from "./screens/Move.jsx";
import { MultisigRouter } from "./screens/multisig/index.jsx";
import { IdentityRouter } from "./screens/identity/index.jsx";
import { ApprovalSheet } from "./components/ApprovalSheet.jsx";
import { useSettings } from "./hooks/useSettings.js";
import { useApprovals } from "./hooks/useApprovals.js";

async function sha256Hex(text) {
  const encoded = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

function App() {
  const session = useSession();
  const { wallet, recovery, setWallet, setRecovery } = useWallet();
  const settings = useSettings();
  const approvals = useApprovals();

  // Navigation
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState(null); // null = tab content, or a named screen
  const [pendingMode, setPendingMode] = useState(null); // { mode: "create" } | { mode: "import", mnemonic }

  const navigate = useCallback((s) => setScreen(s), []);
  const goBack = useCallback(() => setScreen(null), []);

  // ── Loading ─────────────────────────────────────────────────────
  if (session.loading) {
    return <div class="screen-centered"><p class="text-body">Loading...</p></div>;
  }

  // ── Lock screen ─────────────────────────────────────────────────
  if (session.hasPassword && session.locked) {
    return (
      <LockScreen
        onUnlock={session.unlock}
        onForgot={() => {
          navigate("import");
        }}
      />
    );
  }

  // ── Onboarding (no wallet) ──────────────────────────────────────
  if (!wallet) {
    // Password setup step
    if (screen === "password-setup" && pendingMode) {
      return (
        <PasswordSetupScreen
          onSubmit={async (password) => {
            const passwordHash = await sha256Hex(`dilithia-lock:${password}`);
            await chrome.storage.local.set({
              "dilithia.lockConfig": { passwordHash, autoLockMinutes: 15 },
            });

            // Create or import wallet via background crypto
            const { getCryptoBackend } = await import("../lib/crypto-backend.js");
            const backend = await getCryptoBackend();

            let created;
            if (pendingMode.mode === "create") {
              created = await backend.createWallet(password);
            } else {
              created = await backend.importWalletFromMnemonic(pendingMode.mnemonic, password);
            }

            const w = {
              version: 2,
              mode: created.mode ?? "dilithia-core-wasm",
              algorithm: "mldsa65",
              address: created.address,
              publicKey: created.public_key ?? created.publicKey,
              secretKey: created.secret_key ?? created.secretKey,
              walletFile: created.wallet_file ?? created.walletFile,
              recovery: created.recovery ?? {
                mnemonic: created.mnemonic,
                passwordProtected: true,
                createdAt: new Date().toISOString(),
                acknowledged: pendingMode.mode === "import",
              },
              accountIndex: created.account_index ?? created.accountIndex ?? 0,
            };

            await setWallet(w);
            if (w.recovery?.mnemonic) {
              await setRecovery(w.recovery);
            }

            // Unlock session
            await session.unlock(password);
            setPendingMode(null);

            if (pendingMode.mode === "create") {
              navigate("recovery");
            } else {
              navigate(null);
            }
          }}
        />
      );
    }

    // Import mnemonic step
    if (screen === "import") {
      return (
        <ImportMnemonicScreen
          onBack={() => navigate(null)}
          onImport={async (mnemonic) => {
            // Validate mnemonic first
            const { getCryptoBackend } = await import("../lib/crypto-backend.js");
            const backend = await getCryptoBackend();
            await backend.validateMnemonic(mnemonic);

            setPendingMode({ mode: "import", mnemonic });
            navigate("password-setup");
          }}
        />
      );
    }

    // Main onboarding
    return (
      <OnboardingScreen
        onCreateWallet={() => {
          setPendingMode({ mode: "create" });
          navigate("password-setup");
        }}
        onImportWallet={() => navigate("import")}
      />
    );
  }

  // ── Recovery screen ─────────────────────────────────────────────
  if (screen === "recovery") {
    return (
      <RecoveryScreen
        wallet={wallet}
        recovery={recovery}
        onSetRecovery={setRecovery}
        onBack={goBack}
        onDone={() => navigate(null)}
      />
    );
  }

  // ── Full screens (over tabs) ───────────────────────────────────
  if (screen === "send") {
    return <SendScreen wallet={wallet} onBack={goBack} />;
  }
  if (screen === "swap") {
    return <SwapScreen wallet={wallet} onBack={goBack} />;
  }
  if (screen === "move") {
    return <MoveScreen wallet={wallet} onBack={goBack} />;
  }
  if (screen === "receive") {
    return <ReceiveScreen wallet={wallet} onBack={goBack} />;
  }
  if (screen === "accounts") {
    return (
      <AccountsScreen
        wallet={wallet}
        onBack={goBack}
        onSelectAccount={() => { /* wallet hook will auto-update */ }}
      />
    );
  }
  if (screen === "connected-sites") {
    return <ConnectedSitesScreen onBack={goBack} />;
  }
  if (screen === "multisig") {
    return <MultisigRouter address={wallet?.address} onBack={goBack} />;
  }
  if (screen === "identity") {
    return <IdentityRouter address={wallet?.address} onBack={goBack} />;
  }
  if (screen === "settings") {
    return (
      <SettingsScreen
        wallet={wallet}
        onBack={goBack}
        onLock={async () => { await session.lock(); }}
        onLogout={async () => {
          await chrome.storage.local.remove(["dilithia.wallet", "dilithia.walletRecovery", "dilithia.lockConfig", "dilithia.connections", "dilithia.shieldedState"]);
          await session.lock();
          navigate(null);
          setTab("home");
        }}
        onRecovery={() => navigate("recovery")}
        onAccounts={() => navigate("accounts")}
        onConnectedSites={() => navigate("connected-sites")}
      />
    );
  }
  if (screen === "import") {
    return (
      <ImportMnemonicScreen
        onBack={goBack}
        onImport={async (mnemonic) => {
          const { getCryptoBackend } = await import("../lib/crypto-backend.js");
          const backend = await getCryptoBackend();
          await backend.validateMnemonic(mnemonic);
          setPendingMode({ mode: "import", mnemonic });
          navigate("password-setup");
        }}
      />
    );
  }

  // ── Tab content ────────────────────────────────────────────────
  let tabContent;
  switch (tab) {
    case "home":
      tabContent = (
        <>
          <HomeHeader
            wallet={wallet}
            onAccounts={() => navigate("accounts")}
            onSettings={() => navigate("settings")}
          />
          <HomeScreen
            wallet={wallet}
            settings={settings}
            onSend={() => navigate("send")}
            onReceive={() => navigate("receive")}
            onMove={() => navigate("move")}
            onSwap={() => navigate("swap")}
          />
        </>
      );
      break;
    case "activity":
      tabContent = <ActivityScreen wallet={wallet} />;
      break;
    case "privacy":
      tabContent = <ShieldScreen wallet={wallet} />;
      break;
    case "more":
      tabContent = (
        <>
          <NavHeader title="More" onBack={() => setTab("home")} />
          <MoreScreen
            onNavigate={async (id) => {
              if (id === "privacy") { setTab("privacy"); return; }
              navigate(id);
            }}
            onLock={async () => { await session.lock(); }}
            onLogout={async () => {
              await chrome.storage.local.remove(["dilithia.wallet", "dilithia.walletRecovery", "dilithia.lockConfig", "dilithia.connections", "dilithia.shieldedState"]);
              await session.lock();
              navigate(null);
              setTab("home");
            }}
          />
        </>
      );
      break;
    default:
      tabContent = null;
  }

  return (
    <>
      {tabContent}
      <TabBar active={tab} onSelect={(t) => { setScreen(null); setTab(t); }} />
      {tab === "home" && approvals.items.length > 0 && (
        <ApprovalSheet
          items={approvals.items}
          onApprove={approvals.approve}
          onReject={approvals.reject}
        />
      )}
    </>
  );
}

render(<App />, document.getElementById("app"));
