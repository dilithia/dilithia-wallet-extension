import { useState, useEffect } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";
import { TxStatus } from "../components/TxStatus.jsx";

// ── SVG Icons ────────────────────────────────────────────────────────

const SwapArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="7 3 3 7 7 11" /><path d="M3 7h18" />
    <polyline points="17 13 21 17 17 21" /><path d="M21 17H3" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────

async function querySwapService(rpcUrl, swapContract, method, args = {}) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "qsc_query", params: { contract: swapContract, method, args } }),
  });
  if (!res.ok) throw new Error(`Swap query failed: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "Swap query error");
  return data.result;
}

// ── Not configured state ─────────────────────────────────────────────

function NoSwapConfigured({ onBack }) {
  return (
    <div class="screen">
      <NavHeader title="Swap" onBack={onBack} />
      <div class="screen-centered">
        <div class="stack stack-md" style={{ maxWidth: 260, textAlign: "center" }}>
          <div style={{ margin: "0 auto", color: "var(--color-muted)" }}><SwapArrowIcon /></div>
          <p class="text-body">No swap service configured.</p>
          <p class="text-body" style={{ fontSize: 12 }}>Go to Settings → Swap Service to set up a token exchange provider.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Swap Screen ─────────────────────────────────────────────────

export function SwapScreen({ wallet, onBack }) {
  const [swapService, setSwapService] = useState(null);
  const [rpcUrl, setRpcUrl] = useState("");
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  // Quote
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  // Submit
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Load config + available pairs
  useEffect(() => {
    (async () => {
      const data = await chrome.storage.local.get("dilithia.settings");
      const s = data["dilithia.settings"] ?? {};
      const svc = s.swapService ?? "";
      const rpc = s.rpcUrl ?? "http://127.0.0.1:8000/rpc";
      setSwapService(svc);
      setRpcUrl(rpc);

      if (svc) {
        try {
          const result = await querySwapService(rpc, svc, "available_pairs");
          const pairList = Array.isArray(result) ? result : result?.pairs ?? [];
          setPairs(pairList);
          if (pairList.length > 0) {
            setFromToken(pairList[0].from ?? pairList[0].base ?? "");
            setToToken(pairList[0].to ?? pairList[0].quote ?? "");
          }
        } catch { setPairs([]); }
      }
      setLoading(false);
    })();
  }, []);

  // Get quote when from/to/amount change
  useEffect(() => {
    if (!swapService || !fromToken || !toToken || !amount) { setQuote(null); return; }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setQuote(null); return; }

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);

    (async () => {
      try {
        const result = await querySwapService(rpcUrl, swapService, "get_quote", {
          from: fromToken, to: toToken, amount: n,
          slippage: Number(slippage) / 100,
        });
        if (!cancelled) setQuote(result);
      } catch (e) {
        if (!cancelled) setQuoteError(e.message ?? "Quote failed");
      }
      if (!cancelled) setQuoteLoading(false);
    })();

    return () => { cancelled = true; };
  }, [swapService, rpcUrl, fromToken, toToken, amount, slippage]);

  // Flip from/to
  const handleFlip = () => { setFromToken(toToken); setToToken(fromToken); setQuote(null); };

  // Submit swap
  const handleSwap = async () => {
    if (!quote) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await chrome.runtime.sendMessage({
        type: "DILITHIA_PROVIDER_REQUEST",
        origin: "chrome-extension://popup",
        method: "dilithia_sendTransaction",
        params: {
          transaction: {
            contract: swapService,
            method: "swap",
            args: {
              from: fromToken, to: toToken,
              amount: Number(amount),
              min_received: quote.minReceived ?? quote.min_received ?? 0,
              slippage: Number(slippage) / 100,
            },
          },
        },
      });
      if (res?.ok) {
        setResult({ success: `Swap submitted · ${(res.result?.tx_hash ?? res.result?.txHash ?? "").slice(0, 14)}…` });
        setAmount("");
        setQuote(null);
      } else {
        setResult({ error: res?.error ?? "Swap failed" });
      }
    } catch (e) {
      setResult({ error: e.message ?? "Swap failed" });
    }
    setBusy(false);
  };

  if (loading) return <div class="screen"><NavHeader title="Swap" onBack={onBack} /><div class="screen-centered"><p class="text-body">Loading...</p></div></div>;
  if (!swapService) return <NoSwapConfigured onBack={onBack} />;

  // Extract unique token symbols from pairs
  const fromOptions = [...new Set(pairs.map((p) => p.from ?? p.base).filter(Boolean))];
  const toOptions = [...new Set(pairs.filter((p) => (p.from ?? p.base) === fromToken).map((p) => p.to ?? p.quote).filter(Boolean))];

  return (
    <div class="screen">
      <NavHeader title="Swap" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-md" style={{ maxWidth: 320, margin: "0 auto", paddingTop: 8 }}>

          {/* From */}
          <div class="card">
            <div class="field">
              <label class="field-label">From</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select class="input" style={{ flex: "0 0 100px" }} value={fromToken} onChange={(e) => { setFromToken(e.target.value); setQuote(null); }}>
                  {fromOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  {fromOptions.length === 0 && <option value="">—</option>}
                </select>
                <input class="input" style={{ flex: 1 }} type="text" inputMode="decimal" placeholder="0.00" value={amount} onInput={(e) => setAmount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Flip button */}
          <div class="text-center">
            <button onClick={handleFlip} style={{
              background: "var(--color-bg)", border: "2px solid var(--color-border)",
              borderRadius: "50%", width: 36, height: 36, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-accent)",
            }} aria-label="Flip tokens">
              <SwapArrowIcon />
            </button>
          </div>

          {/* To */}
          <div class="card">
            <div class="field">
              <label class="field-label">To</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select class="input" style={{ flex: "0 0 100px" }} value={toToken} onChange={(e) => { setToToken(e.target.value); setQuote(null); }}>
                  {toOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  {toOptions.length === 0 && <option value="">—</option>}
                </select>
                <span style={{ flex: 1, fontSize: 20, fontWeight: 600, textAlign: "right", padding: "0 8px" }}>
                  {quoteLoading ? "···" : quote?.estimated ?? quote?.estimatedReceived ?? "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Slippage */}
          <div class="field">
            <label class="field-label">Slippage tolerance</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["0.1", "0.5", "1.0", "3.0"].map((v) => (
                <button key={v} onClick={() => setSlippage(v)} style={{
                  flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)",
                  border: slippage === v ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: slippage === v ? "#fff7ed" : "transparent",
                  cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 500,
                  color: slippage === v ? "var(--color-accent)" : "var(--color-text)",
                }}>{v}%</button>
              ))}
            </div>
          </div>

          {/* Quote details */}
          {quote && (
            <div class="card" style={{ fontSize: 12 }}>
              <div class="card-row">
                <span class="card-label">Rate</span>
                <span class="card-value">{quote.rate ?? quote.price ?? "—"}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Fee</span>
                <span class="card-value">{quote.fee ?? quote.commission ?? "0"} {quote.feeToken ?? fromToken}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Min received</span>
                <span class="card-value">{quote.minReceived ?? quote.min_received ?? "—"} {toToken}</span>
              </div>
              {quote.priceImpact !== undefined && (
                <div class="card-row">
                  <span class="card-label">Price impact</span>
                  <span class="card-value" style={{ color: Number(quote.priceImpact) > 5 ? "var(--color-error)" : "inherit" }}>
                    {quote.priceImpact}%
                  </span>
                </div>
              )}
            </div>
          )}

          {quoteError && <p class="text-error" style={{ fontSize: 12 }}>{quoteError}</p>}
          {pairs.length === 0 && <p class="text-body text-center" style={{ fontSize: 12 }}>No trading pairs available from this service.</p>}

          {/* Result */}
          <TxStatus step={busy ? "approval" : null} status={result} />

          {/* Submit */}
          <button class="btn btn-primary" onClick={handleSwap} disabled={busy || !quote}>
            {busy ? "Swapping..." : "Swap"}
          </button>

        </div>
      </div>
    </div>
  );
}
