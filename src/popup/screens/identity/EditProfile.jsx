import { useState, useEffect } from "preact/hooks";
import { NavHeader } from "../../components/NavHeader.jsx";
import { TxStatus } from "../../components/TxStatus.jsx";
import { getNameRecords, setNameRecord, PROFILE_FIELDS } from "../../lib/identity-model.js";

export function EditProfileScreen({ name, onBack }) {
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!name) return;
    getNameRecords(name)
      .then((result) => setFields(result?.records ?? result ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [name]);

  const handleSave = async (key, value) => {
    setSaving(key);
    setStatus(null);
    try {
      await setNameRecord(name, key, value.trim());
      setStatus({ success: `${key} updated` });
    } catch (e) {
      setStatus({ error: e.message ?? "Failed to save" });
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div class="screen">
        <NavHeader title={name} onBack={onBack} />
        <div class="screen-centered"><p class="text-body">Loading...</p></div>
      </div>
    );
  }

  return (
    <div class="screen">
      <NavHeader title={name} onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg">
          <p class="text-body">
            Edit your on-chain profile for <strong>{name}</strong>. Each field is stored as a name service record. Saving a field is an on-chain transaction.
          </p>

          {PROFILE_FIELDS.map((field) => (
            <div key={field.key} class="field">
              <label class="field-label">{field.label}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  class="input"
                  style={{ flex: 1 }}
                  placeholder={field.placeholder}
                  value={fields[field.key] ?? ""}
                  onInput={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                />
                <button
                  class="btn btn-subtle"
                  style={{ width: "auto", padding: "8px 14px", fontSize: 12 }}
                  onClick={() => handleSave(field.key, fields[field.key] ?? "")}
                  disabled={saving === field.key}
                >
                  {saving === field.key ? "..." : "Save"}
                </button>
              </div>
            </div>
          ))}

          <TxStatus status={status} />
        </div>
      </div>
    </div>
  );
}
