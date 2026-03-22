import { useState } from "preact/hooks";
import { truncate, originHostname } from "../lib/format.js";

// ── SVG Icons ────────────────────────────────────────────────────────

const ConnectIcon = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--color-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 7h3a5 5 0 010 10h-3M9 17H6a5 5 0 010-10h3" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const SignIcon = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--color-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
  </svg>
);
const TxIcon = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--color-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--color-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────

function kindConfig(kind) {
  const map = {
    connect:           { Icon: ConnectIcon, title: "Connection Request",  description: "This site wants to connect to your wallet and access your account.", offchain: true },
    sign:              { Icon: SignIcon,     title: "Sign Message",        description: "This site is asking you to sign a message for verification. This is offchain — no transaction will be sent and no gas will be charged.", offchain: true },
    sign_payload:      { Icon: SignIcon,     title: "Sign Payload",       description: "This site is asking you to sign a structured payload. This is offchain — no transaction, no gas.", offchain: true },
    ownership_proof:   { Icon: SignIcon,     title: "Ownership Proof",    description: "This site wants to verify you own this wallet. This is offchain — no transaction, no gas.", offchain: true },
    shielded_deposit:  { Icon: ShieldIcon,  title: "Shielded Deposit",    description: "This site wants to deposit tokens into the shielded pool. This is an on-chain transaction that will cost gas.", offchain: false },
    shielded_withdraw: { Icon: ShieldIcon,  title: "Shielded Withdraw",   description: "This site wants to withdraw tokens from the shielded pool. This is an on-chain transaction that will cost gas.", offchain: false },
    approval:          { Icon: TxIcon,      title: "Token Approval",      description: "This site is requesting permission to spend tokens on your behalf. This is an on-chain transaction that will cost gas.", offchain: false },
    contract_call:     { Icon: TxIcon,      title: "Contract Call",       description: "This site wants to execute a contract method. This is an on-chain transaction that will cost gas.", offchain: false },
    transaction:       { Icon: TxIcon,      title: "Transaction",         description: "This site wants to submit a transaction from your account. This will cost gas.", offchain: false },
  };
  return map[kind] ?? { Icon: TxIcon, title: "Request", description: "A dapp is making a request.", offchain: false };
}

// ── Permission pills ─────────────────────────────────────────────────

const PERMISSION_LABELS = {
  dilithia_getPublicKey: "View public key",
  dilithia_signMessage: "Sign messages",
  dilithia_signPayload: "Sign payloads",
  dilithia_buildOwnershipProof: "Ownership proofs",
  dilithia_sendTransaction: "Send transactions",
  dilithia_callContract: "Call contracts",
  dilithia_simulateCall: "Simulate calls",
  dilithia_estimateGas: "Estimate gas",
  dilithia_getNonce: "Read nonce",
  dilithia_getBalance: "Read balance",
  dilithia_getNetworkInfo: "Network info",
  dilithia_getReceipt: "Read receipts",
  dilithia_queryContract: "Query contracts",
  dilithia_getTransactionHistory: "Transaction history",
  dilithia_shieldedDeposit: "Shielded deposits",
  dilithia_shieldedWithdraw: "Shielded withdrawals",
  dilithia_shieldedBalance: "Shielded balance",
  dilithia_shieldedComplianceProof: "Compliance proofs",
};

function permLabel(perm) {
  return PERMISSION_LABELS[perm] ?? perm.replace("dilithia_", "");
}

// ── Detail sections per kind ─────────────────────────────────────────

/**
 * Rich grant tuple display for qsc-rs PermissionGrant.
 * Shows: Type badge, Token, Amount/Cap, Destinations, Deadline, Cooldown, Budget.
 *
 * Grant types from qsc-rs permissions contract:
 *   Transfer { max_amount, token, allowed_destinations }
 *   Subscription { max_per_period, period_blocks, token, allowed_destinations }
 *   ContractCall { methods }
 *   OneShot { max_amount, token, allowed_destinations }
 */
function GrantTuple({ grant }) {
  const gt = grant.grant_type ?? grant.grantType ?? {};
  const type = gt.type ?? "unknown";
  const typeLabels = { Transfer: "Transfer allowance", Subscription: "Recurring mandate", ContractCall: "Contract call", OneShot: "One-time permit" };
  const typeColors = { Transfer: "#3498db", Subscription: "#9b59b6", ContractCall: "#e67e22", OneShot: "#27ae60" };

  const rows = [];

  // Token
  if (type !== "ContractCall") {
    rows.push(["Token", gt.token ?? "DILI (native)"]);
  }

  // Amount / Cap
  if ((type === "Transfer" || type === "OneShot") && gt.max_amount !== undefined) {
    rows.push(["Max amount", gt.max_amount.toLocaleString()]);
  }
  if (type === "Subscription") {
    rows.push(["Per period", (gt.max_per_period ?? 0).toLocaleString()]);
    rows.push(["Period", `${(gt.period_blocks ?? 0).toLocaleString()} blocks`]);
  }

  // Methods
  if (type === "ContractCall" && Array.isArray(gt.methods)) {
    rows.push(["Methods", gt.methods.join(", ")]);
  }

  // Destinations
  if (Array.isArray(gt.allowed_destinations) && gt.allowed_destinations.length > 0) {
    rows.push(["Destinations", gt.allowed_destinations.map((d) => truncate(d, 14)).join(", ")]);
  } else if (type !== "ContractCall") {
    rows.push(["Destinations", "Any address"]);
  }

  // Deadline, Budget, Cooldown
  if (grant.deadline > 0) rows.push(["Expires", `Block ${grant.deadline.toLocaleString()}`]);
  if (grant.budget > 0) rows.push(["Budget", grant.budget.toLocaleString()]);
  if (grant.cooldown > 0) rows.push(["Cooldown", `${grant.cooldown.toLocaleString()} blocks`]);

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "10px 12px", marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: `${typeColors[type] ?? "#888"}18`, color: typeColors[type] ?? "#888" }}>
          {typeLabels[type] ?? type}
        </span>
        {grant.target && grant.target !== "*" && (
          <span class="text-mono" style={{ fontSize: 10, color: "var(--color-muted)" }}>→ {truncate(grant.target, 16)}</span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 10px", fontSize: 12 }}>
        {rows.map(([label, value], i) => (
          <>
            <span key={`l${i}`} style={{ color: "var(--color-muted)", fontWeight: 500 }}>{label}</span>
            <span key={`v${i}`} style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{value}</span>
          </>
        ))}
      </div>
    </div>
  );
}

function ConnectDetails({ summary }) {
  const perms = Array.isArray(summary?.permissions) ? summary.permissions : [];
  const grants = Array.isArray(summary?.grants) ? summary.grants : [];

  // Rich grants from qsc-rs permissions contract
  if (grants.length > 0) {
    return (
      <div class="stack stack-sm">
        <p class="card-label">Requested permissions</p>
        {grants.map((g, i) => <GrantTuple key={i} grant={g} />)}
      </div>
    );
  }

  // Fallback: simple method list
  return (
    <div class="stack stack-sm">
      <p class="card-label">Requested permissions</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {perms.map((p) => (
          <span key={p} style={{
            fontSize: 12, fontWeight: 500, padding: "4px 10px",
            borderRadius: 12, background: "#fff7ed", color: "var(--color-accent)",
          }}>
            {permLabel(p)}
          </span>
        ))}
        {perms.length === 0 && <span style={{ fontSize: 12, color: "var(--color-muted)" }}>Default permissions</span>}
      </div>
    </div>
  );
}

function SignDetails({ summary }) {
  const msg = summary?.message ?? "";
  return (
    <div class="stack stack-sm">
      <p class="card-label">Message to sign</p>
      <div class="card" style={{
        fontSize: 13, fontFamily: "var(--font-mono)", wordBreak: "break-all",
        maxHeight: 120, overflowY: "auto", lineHeight: 1.5,
      }}>
        {msg || <span style={{ color: "var(--color-muted)" }}>Empty message</span>}
      </div>
    </div>
  );
}

function ShieldedDetails({ summary, kind }) {
  return (
    <div class="stack stack-sm">
      {summary?.amount !== undefined && <DetailRow label="Amount" value={`${summary.amount} DILI`} />}
      {kind === "shielded_withdraw" && summary?.recipient && <DetailRow label="Recipient" value={truncate(summary.recipient, 20)} mono />}
      {summary?.commitment && <DetailRow label="Commitment" value={truncate(summary.commitment, 20)} mono />}
      <SimulationBanner simulation={summary?.simulation} />
    </div>
  );
}

function TransactionDetails({ summary }) {
  return (
    <div class="stack stack-sm">
      {summary?.contract && <DetailRow label="Contract" value={summary.contract} />}
      {summary?.method && <DetailRow label="Method" value={summary.method} bold />}
      {summary?.args && Object.keys(summary.args).length > 0 && (
        <div>
          <p class="card-label" style={{ paddingBottom: 4 }}>Arguments</p>
          <div class="card" style={{ fontSize: 11, fontFamily: "var(--font-mono)", maxHeight: 80, overflowY: "auto", wordBreak: "break-all" }}>
            {Object.entries(summary.args).map(([k, v]) => (
              <div key={k} style={{ padding: "2px 0" }}>
                <span style={{ color: "var(--color-muted)" }}>{k}:</span> {JSON.stringify(v)}
              </div>
            ))}
          </div>
        </div>
      )}
      {summary?.nonce !== undefined && <DetailRow label="Nonce" value={summary.nonce} />}
      <SimulationBanner simulation={summary?.simulation} />
    </div>
  );
}

function DetailRow({ label, value, mono, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0" }}>
      <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: bold ? 600 : 500, textAlign: "right",
        maxWidth: 200, wordBreak: "break-all",
        fontFamily: mono ? "var(--font-mono)" : "inherit",
      }}>{String(value ?? "")}</span>
    </div>
  );
}

function SimulationBanner({ simulation }) {
  if (!simulation) return null;
  const ok = simulation.success;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
      borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500,
      background: ok ? "#eafbf0" : "#fdeaea",
      color: ok ? "var(--color-success)" : "var(--color-error)",
    }}>
      <span style={{ fontSize: 16 }}>{ok ? "✓" : "✗"}</span>
      <span>
        Simulation {ok ? "passed" : "failed"}
        {simulation.gas_used ? ` · gas ${simulation.gas_used}` : ""}
        {!ok && simulation.error ? ` · ${simulation.error}` : ""}
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function ApprovalSheet({ items, onApprove, onReject }) {
  const [busy, setBusy] = useState(false);

  if (!items || items.length === 0) return null;

  const item = items[0];
  const kind = item.summary?.kind ?? "connect";
  const { Icon, title, description, offchain } = kindConfig(kind);
  const isOffchain = offchain || item.summary?.offchain === true;
  const remaining = items.length - 1;

  const handleApprove = async () => {
    setBusy(true);
    try { await onApprove(item.approvalId); } catch { /* */ }
    setBusy(false);
  };

  const handleReject = async () => {
    setBusy(true);
    try { await onReject(item.approvalId); } catch { /* */ }
    setBusy(false);
  };

  return (
    <div class="approval-sheet">
      {/* Drag indicator */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
      </div>

      <div class="stack stack-md" style={{ padding: "4px 20px 20px" }}>

        {/* Icon + Title + Badge + Description */}
        <div class="text-center stack stack-sm" style={{ paddingTop: 4 }}>
          <div style={{ margin: "0 auto" }}><Icon /></div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
              background: isOffchain ? "#eafbf0" : "#fff7ed",
              color: isOffchain ? "var(--color-success)" : "var(--color-accent)",
            }}>
              {isOffchain ? "Offchain · No gas" : "On-chain · Gas required"}
            </span>
          </div>
          <p class="text-body" style={{ fontSize: 13 }}>{description}</p>
        </div>

        {/* Origin */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
          background: "#fafaf8", borderRadius: "var(--radius-sm)",
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            background: "#f5f0eb", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--color-accent)",
          }}>
            {originHostname(item.origin).charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{originHostname(item.origin)}</div>
          </div>
        </div>

        {/* Contextual details */}
        {kind === "connect" && <ConnectDetails summary={item.summary} />}
        {(kind === "sign" || kind === "sign_payload" || kind === "ownership_proof") && <SignDetails summary={item.summary} />}
        {(kind === "shielded_deposit" || kind === "shielded_withdraw") && <ShieldedDetails summary={item.summary} kind={kind} />}
        {(kind === "contract_call" || kind === "transaction" || kind === "approval") && <TransactionDetails summary={item.summary} />}

        {/* Remaining */}
        {remaining > 0 && (
          <p class="text-body text-center" style={{ fontSize: 12 }}>
            +{remaining} more pending request{remaining > 1 ? "s" : ""}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button class="btn btn-subtle" style={{ flex: 1 }} onClick={handleReject} disabled={busy}>
            Reject
          </button>
          <button class="btn btn-primary" style={{ flex: 1 }} onClick={handleApprove} disabled={busy}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
