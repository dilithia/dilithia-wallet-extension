import { useState, useEffect, useCallback } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";

// ── SVG Icons ────────────────────────────────────────────────────────

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--color-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

function truncateOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.hostname + (url.port ? `:${url.port}` : "");
  } catch {
    return origin?.length > 30 ? `${origin.slice(0, 28)}…` : origin;
  }
}

export function ConnectedSitesScreen({ onBack }) {
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const load = useCallback(async () => {
    const data = await chrome.storage.local.get("dilithia.connections");
    setConnections(data["dilithia.connections"] ?? {});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    const res = await chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_REVOKE_CONNECTION", origin: revokeTarget });
    if (res?.ok) await load();
    setRevokeTarget(null);
  }, [revokeTarget, load]);

  const origins = Object.keys(connections);

  if (loading) {
    return (
      <div class="screen">
        <NavHeader title="Manage Permissions" onBack={onBack} />
        <div class="screen-centered"><p class="text-body">Loading...</p></div>
      </div>
    );
  }

  return (
    <div class="screen">
      <NavHeader title="Manage Permissions" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-md">

          {origins.length === 0 && (
            <div class="text-center" style={{ paddingTop: 48 }}>
              <div style={{ margin: "0 auto 12px" }}><GlobeIcon /></div>
              <p class="text-body">No sites connected.</p>
              <p class="text-body" style={{ fontSize: 12 }}>When a dapp connects via window.dilithia, it will appear here.</p>
            </div>
          )}

          {origins.map((origin) => {
            const conn = connections[origin];
            const perms = conn?.permissions ?? [];
            return (
              <div key={origin} style={{
                border: "1px solid var(--color-border)", borderRadius: "var(--radius)",
                overflow: "hidden",
              }}>
                {/* Header row */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  borderBottom: "1px solid var(--color-border)",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "#f5f0eb", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 14, fontWeight: 700,
                    color: "var(--color-accent)",
                  }}>
                    {truncateOrigin(origin).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{truncateOrigin(origin)}</div>
                    <div class="text-mono" style={{ fontSize: 10, color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {origin}
                    </div>
                  </div>
                  <button
                    onClick={() => setRevokeTarget(origin)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: 6, color: "var(--color-error)", borderRadius: 4,
                    }}
                    aria-label="Revoke"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Permissions */}
                {perms.length > 0 && (
                  <div style={{ padding: "8px 14px 12px" }}>
                    <p class="card-label" style={{ paddingBottom: 6 }}>Permissions</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {perms.map((p) => (
                        <span key={p} style={{
                          fontSize: 10, fontWeight: 500, padding: "3px 8px",
                          borderRadius: 10, background: "#fff7ed", color: "var(--color-accent)",
                          whiteSpace: "nowrap",
                        }}>
                          {p.replace("dilithia_", "")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Connection"
        message={`Disconnect ${revokeTarget ? truncateOrigin(revokeTarget) : ""}? The site will need to reconnect to access your wallet.`}
        confirmLabel="Revoke"
        danger
      />
    </div>
  );
}
