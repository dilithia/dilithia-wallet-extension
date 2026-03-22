/**
 * Transaction status display — shows the current step of a multi-step operation.
 * Handles: waiting for approval, step progress, success, rejection, and errors.
 */

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style={{ animation: "spin 1s linear infinite" }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

export function TxStatus({ step, status }) {
  if (!step && !status) return null;

  // Waiting for approval
  if (step === "approval") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        borderRadius: "var(--radius-sm)", background: "#fff7ed",
        animation: "pulse 2s ease-in-out infinite",
      }}>
        <SpinnerIcon />
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: "var(--color-accent)" }}>Waiting for approval</div>
          <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Check the popup or notification to approve</div>
        </div>
      </div>
    );
  }

  // Step progress (1/4, 2/4, etc.)
  if (step) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
        <SpinnerIcon />
        <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{step}</span>
      </div>
    );
  }

  // Error / rejection
  if (status?.error) {
    const isRejected = status.error.includes("rejected") || status.error.includes("Rejected");
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        background: isRejected ? "#f5f0eb" : "#fdeaea",
      }}>
        <span style={{ fontSize: 16 }}>{isRejected ? "✕" : "!"}</span>
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: isRejected ? "var(--color-muted)" : "var(--color-error)" }}>
            {isRejected ? "Rejected" : "Error"}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
            {isRejected ? "You rejected the request in the wallet" : status.error}
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (status?.success) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
        borderRadius: "var(--radius-sm)", background: "#eafbf0",
      }}>
        <span style={{ fontSize: 16, color: "var(--color-success)" }}>✓</span>
        <span style={{ fontSize: 13, color: "var(--color-success)", fontWeight: 500 }}>{status.success}</span>
      </div>
    );
  }

  return null;
}
