import { NavHeader } from "../../components/NavHeader.jsx";
import { useIdentity } from "../../hooks/useIdentity.js";
import { truncateAddress, truncate } from "../../lib/format.js";

// ── SVG Icons ────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const BadgeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 15l-3 3-1-4-4-1 3-3-1-4 4 1 3-3 3 3 4-1-1 4 3 3-4 1-1 4z" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-muted)" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6" /></svg>
);

function CredentialStatusBadge({ status }) {
  const isActive = status === "active";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8,
      background: isActive ? "#eafbf0" : "#fdeaea",
      color: isActive ? "var(--color-success)" : "var(--color-error)",
    }}>
      {isActive ? "Active" : "Revoked"}
    </span>
  );
}

export function IdentityHomeScreen({ address, onBack, onEditProfile, onRegisterName, onCredentialDetail, onRequestProof }) {
  const { names, primaryName, records, credentials, loading, error } = useIdentity(address);

  if (loading) {
    return (
      <div class="screen">
        <NavHeader title="Identity" onBack={onBack} />
        <div class="screen-centered"><p class="text-body">Loading...</p></div>
      </div>
    );
  }

  const displayName = records.display_name ?? primaryName ?? truncateAddress(address);
  const avatar = records.avatar;
  const bio = records.bio;

  return (
    <div class="screen">
      <NavHeader title="Identity" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">

          {/* Profile card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 8 }}>
            {avatar ? (
              <img src={avatar} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <UserIcon />
            )}
            <div class="text-center">
              <div style={{ fontWeight: 600, fontSize: 18 }}>{displayName}</div>
              {primaryName && (
                <div style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 500 }}>{primaryName}</div>
              )}
              {!primaryName && (
                <div class="text-mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>{truncateAddress(address)}</div>
              )}
              {bio && <p class="text-body" style={{ paddingTop: 4 }}>{bio}</p>}
            </div>
          </div>

          {/* Actions */}
          <div class="stack stack-sm">
            {primaryName ? (
              <button class="btn btn-subtle" onClick={() => onEditProfile(primaryName)}>
                Edit Profile
              </button>
            ) : (
              <button class="btn btn-primary" onClick={onRegisterName}>
                Register .dili Name
              </button>
            )}
          </div>

          {/* Names */}
          {names.length > 0 && (
            <div>
              <p class="card-label" style={{ paddingBottom: 6 }}>Names</p>
              {names.map((entry) => {
                const name = typeof entry === "string" ? entry : entry.name;
                return (
                  <button key={name} onClick={() => onEditProfile(name)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 4px",
                    background: "none", border: "none", cursor: "pointer", width: "100%",
                    textAlign: "left", font: "inherit",
                  }}>
                    <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{name}</span>
                    {name === primaryName && (
                      <span style={{ fontSize: 10, color: "var(--color-accent)", fontWeight: 600 }}>Primary</span>
                    )}
                    <Chevron />
                  </button>
                );
              })}
            </div>
          )}

          {/* Credentials */}
          <div>
            <p class="card-label" style={{ paddingBottom: 6 }}>Credentials</p>
            {credentials.length === 0 && (
              <p class="text-body" style={{ fontSize: 12 }}>No credentials issued to this address yet.</p>
            )}
            {credentials.map((cred, i) => (
              <button key={cred.commitment ?? i} onClick={() => onCredentialDetail(cred)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 4px",
                background: "none", border: "none", cursor: "pointer", width: "100%",
                textAlign: "left", font: "inherit",
              }}>
                <span style={{ color: "var(--color-accent)", flexShrink: 0 }}><BadgeIcon /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>
                    {cred.schema_name ?? truncate(cred.schema_hash ?? "Credential", 16)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                    Issuer: {truncateAddress(cred.issuer ?? "")}
                  </div>
                </div>
                <CredentialStatusBadge status={cred.status ?? "active"} />
                <Chevron />
              </button>
            ))}
          </div>

          {/* Selective proof */}
          {credentials.length > 0 && (
            <button class="btn btn-subtle" onClick={onRequestProof}>
              Share Selective Proof
            </button>
          )}

          {error && <p class="text-error" style={{ fontSize: 12 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
