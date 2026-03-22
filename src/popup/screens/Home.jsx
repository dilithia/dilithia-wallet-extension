import { useState, useEffect } from "preact/hooks";
import { useOverview } from "../hooks/useOverview.js";
import { useHiddenAssets } from "../hooks/useHiddenAssets.js";
import { truncateAddress, buildExplorerUrl } from "../lib/format.js";

// ── SVG Icons ────────────────────────────────────────────────────────

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
const ReceiveIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);
const SwapIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
    <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">
    <path d="M9 9h9v11H9z" /><path d="M6 15H5a1 1 0 01-1-1V5a1 1 0 011-1h9a1 1 0 011 1v1" stroke-linecap="round" />
  </svg>
);
const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 5h5v5" /><path d="M10 14L19 5" /><path d="M19 13v5a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h5" />
  </svg>
);

// ── Sub-components ───────────────────────────────────────────────────

function InlineActions({ explorerBaseUrl, kind, value }) {
  const href = buildExplorerUrl(explorerBaseUrl, kind, value);
  return (
    <span style={{ display: "inline-flex", gap: 4, marginLeft: 6 }}>
      <button class="mini-icon-btn" onClick={() => value && navigator.clipboard.writeText(String(value))} aria-label="Copy"><CopyIcon /></button>
      {href && <a class="mini-icon-btn" href={href} target="_blank" rel="noreferrer" aria-label="DiliScan"><ExternalIcon /></a>}
    </span>
  );
}

const HideIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function TokenRow({ item, explorerBaseUrl, onHide }) {
  return (
    <div class="list-item" style={{ position: "relative" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "#f5f0eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "var(--color-accent)" }}>
        {(item.symbol ?? "?").slice(0, 3)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.symbol ?? item.contract ?? "Token"}</div>
        <div class="text-mono" style={{ fontSize: 11, color: "var(--color-muted)", display: "flex", alignItems: "center" }}>
          {truncateAddress(item.contract ?? "")}
          {item.contract && <InlineActions explorerBaseUrl={explorerBaseUrl} kind="contract" value={item.contract} />}
        </div>
      </div>
      <div style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>{String(item.balance ?? 0)}</div>
      {onHide && (
        <button onClick={() => onHide(item.contract)} class="mini-icon-btn" style={{ marginLeft: 4, opacity: 0.4 }} aria-label="Hide token" title="Hide">
          <HideIcon />
        </button>
      )}
    </div>
  );
}

function TxRow({ txHash, explorerBaseUrl }) {
  return (
    <div class="list-item">
      <div class="text-mono" style={{ flex: 1, fontSize: 12, display: "flex", alignItems: "center" }}>
        {truncateAddress(txHash)}
        <InlineActions explorerBaseUrl={explorerBaseUrl} kind="tx" value={txHash} />
      </div>
    </div>
  );
}

// ── Main Home Screen ─────────────────────────────────────────────────

const MoveIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
    <path d="M7 4v16M7 20l-3-3m3 3l3-3M17 20V4m0 0l3 3m-3-3l-3 3" />
  </svg>
);

export function HomeScreen({ wallet, settings, onSend, onReceive, onSwap, onMove }) {
  const address = wallet?.address ?? "";
  const { overview, loading, error } = useOverview(address);
  const { isTokenHidden, isNftHidden, hideToken, hideNft } = useHiddenAssets(address);
  const [tab, setTab] = useState("tokens");
  const explorerBaseUrl = settings?.network?.explorer_url ?? null;
  const currency = settings?.displayCurrency ?? "DILI";

  const display = overview ?? {
    balance: "—", txCount: 0, nonce: 0, stake: 0,
    tokenHoldings: [], nftHoldings: [], recentTxs: [],
    shieldedSummary: { noteCount: 0, totalValue: 0 },
  };

  return (
    <div class="screen-scroll">
      <div class="stack stack-lg">

        {/* ── Action tabs (sticky top) ────────────────────────── */}
        <div style={{ display: "flex", margin: "-16px -16px 0", borderBottom: "1px solid var(--color-border)" }}>
          {[
            { id: "send", label: "Send", Icon: SendIcon, action: onSend },
            { id: "receive", label: "Receive", Icon: ReceiveIcon, action: onReceive },
            { id: "move", label: "Move", Icon: MoveIcon, action: onMove },
            { id: "swap", label: "Swap", Icon: SwapIcon, action: onSwap },
          ].map((item) => (
            <button key={item.id} onClick={item.action} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "12px 0", background: "none", border: "none",
              cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 600,
              color: "var(--color-accent)",
            }}>
              <item.Icon /> {item.label}
            </button>
          ))}
        </div>

        {/* ── Balance (amount + unit horizontal) ──────────────── */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, paddingTop: 8 }}>
          {loading ? (
            <span class="balance-amount" style={{ color: "var(--color-muted)" }}>···</span>
          ) : (
            <span class="balance-amount">{String(display.balance)}</span>
          )}
          <span class="balance-symbol">{currency}</span>
        </div>

        {/* Network pill */}
        {settings?.network?.label && (
          <div class="text-center">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-accent)", background: "#fff7ed", padding: "3px 10px", borderRadius: 12 }}>
              {settings.network.label}
            </span>
          </div>
        )}

        {/* Connection error */}
        {error && (
          <div class="card" style={{ fontSize: 12, color: "var(--color-muted)" }}>
            Connection error. Local wallet features still available.
          </div>
        )}

        {/* Shielded summary */}
        {display.shieldedSummary?.noteCount > 0 && (
          <div class="card">
            <div class="card-row">
              <span class="card-label">Private</span>
              <span class="card-value">{display.shieldedSummary.totalValue} · {display.shieldedSummary.noteCount} notes</span>
            </div>
          </div>
        )}

        {/* Stake */}
        {display.stake > 0 && (
          <div class="card">
            <div class="card-row">
              <span class="card-label">Staked</span>
              <span class="card-value">{display.stake}</span>
            </div>
          </div>
        )}

        {/* ── Asset tabs ──────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
          {["tokens", "nfts", "activity"].map((id) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer",
              font: "inherit", fontWeight: 600, fontSize: 13, textTransform: "capitalize",
              color: tab === id ? "var(--color-accent)" : "var(--color-muted)",
              borderBottom: tab === id ? "2px solid var(--color-accent)" : "2px solid transparent",
            }}>{id}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "tokens" && (() => {
          const visible = display.tokenHoldings.filter((item) => !isTokenHidden(item.contract));
          return (
            <div>
              {visible.length > 0
                ? visible.map((item, i) => <TokenRow key={i} item={item} explorerBaseUrl={explorerBaseUrl} onHide={hideToken} />)
                : <p class="text-body text-center" style={{ padding: "16px 0" }}>No tokens</p>}
            </div>
          );
        })()}
        {tab === "nfts" && (() => {
          const visible = display.nftHoldings.filter((item) => !isNftHidden(item.contract));
          return (
            <div>
              {visible.length > 0
                ? visible.map((item, i) => (
                  <div key={i} class="list-item" style={{ position: "relative" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: "#f0ebe5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>◆</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name ?? item.collection ?? item.contract ?? "NFT"}</div>
                      <div class="text-mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>{item.token_id ? `#${item.token_id}` : truncateAddress(item.contract ?? "")}</div>
                    </div>
                    <button onClick={() => hideNft(item.contract)} class="mini-icon-btn" style={{ opacity: 0.4 }} aria-label="Hide NFT" title="Hide">
                      <HideIcon />
                    </button>
                  </div>
                ))
                : <p class="text-body text-center" style={{ padding: "16px 0" }}>No NFTs</p>}
            </div>
          );
        })()}
        {tab === "activity" && (
          <div>
            {display.recentTxs.length > 0
              ? display.recentTxs.map((txHash, i) => <TxRow key={i} txHash={txHash} explorerBaseUrl={explorerBaseUrl} />)
              : <p class="text-body text-center" style={{ padding: "16px 0" }}>No activity</p>}
          </div>
        )}
      </div>
    </div>
  );
}
