import { useState, useEffect } from "preact/hooks";
import { NavHeader } from "../../components/NavHeader.jsx";
import { getSchema } from "../../lib/identity-model.js";
import { truncateAddress, truncate } from "../../lib/format.js";

export function CredentialDetailScreen({ credential, onBack }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (credential?.schema_hash) {
      getSchema(credential.schema_hash)
        .then(setSchema)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [credential?.schema_hash]);

  const isActive = credential?.status === "active";

  return (
    <div class="screen">
      <NavHeader title="Credential" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">

          {/* Status */}
          <div class="text-center">
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 14px", borderRadius: 12,
              background: isActive ? "#eafbf0" : "#fdeaea",
              color: isActive ? "var(--color-success)" : "var(--color-error)",
            }}>
              {isActive ? "Active" : "Revoked"}
            </span>
          </div>

          {/* Details */}
          <div class="card">
            <div class="card-row">
              <span class="card-label">Issuer</span>
              <span class="card-value text-mono" style={{ fontSize: 11 }}>{truncateAddress(credential?.issuer ?? "")}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Holder</span>
              <span class="card-value text-mono" style={{ fontSize: 11 }}>{truncateAddress(credential?.holder ?? "")}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Commitment</span>
              <span class="card-value text-mono" style={{ fontSize: 11 }}>{truncate(credential?.commitment ?? "", 20)}</span>
            </div>
            {credential?.schema_hash && (
              <div class="card-row">
                <span class="card-label">Schema</span>
                <span class="card-value text-mono" style={{ fontSize: 11 }}>{truncate(credential.schema_hash, 16)}</span>
              </div>
            )}
          </div>

          {/* Schema info */}
          {loading && <p class="text-body text-center">Loading schema...</p>}

          {schema && (
            <div>
              <p class="card-label" style={{ paddingBottom: 6 }}>Schema: {schema.name ?? "Unknown"}</p>
              {schema.version && (
                <p class="text-body" style={{ fontSize: 12, paddingBottom: 8 }}>Version: {schema.version}</p>
              )}
              {Array.isArray(schema.attributes) && schema.attributes.length > 0 && (
                <div class="card">
                  {schema.attributes.map((attr, i) => (
                    <div key={i} class="card-row">
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{attr.name ?? attr}</span>
                      <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{attr.type ?? "string"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* What this means */}
          <div class="card" style={{ fontSize: 12, color: "var(--color-muted)" }}>
            {isActive
              ? "This credential was issued to your address and is currently valid. You can use it to generate selective disclosure proofs."
              : "This credential has been revoked by the issuer and can no longer be used for proofs."}
          </div>
        </div>
      </div>
    </div>
  );
}
