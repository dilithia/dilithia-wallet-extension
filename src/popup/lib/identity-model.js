/**
 * Identity domain model — name service + credentials from qsc-rs.
 *
 * Name service contract: "name_service"
 *   Mutations: register_name, renew, transfer_name, set_target, set_record, release
 *   Queries: resolve, lookup, reverse_resolve, get_records, available, names_by_owner
 *
 * Credential contract: "credential"
 *   Mutations: register_schema, issue, revoke, verify
 *   Queries: get_credential, get_schema, list_by_holder, list_by_issuer
 */

async function query(contract, method, args) {
  const settingsData = await chrome.storage.local.get("dilithia.settings");
  const rpcUrl = settingsData["dilithia.settings"]?.rpcUrl ?? "http://127.0.0.1:8000/rpc";
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "qsc_query", params: { contract, method, args } }),
  });
  if (!res.ok) throw new Error(`${contract}.${method} failed: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? `${contract}.${method} failed`);
  return data.result;
}

async function call(contract, method, args) {
  const res = await chrome.runtime.sendMessage({
    type: "DILITHIA_PROVIDER_REQUEST",
    origin: "chrome-extension://popup",
    method: "dilithia_sendTransaction",
    params: { transaction: { contract, method, args } },
  });
  if (!res?.ok) throw new Error(res?.error ?? `${contract}.${method} failed`);
  return res.result;
}

// ── Name Service ─────────────────────────────────────────────────────

export async function resolveName(name) {
  return query("name_service", "resolve", { name });
}

export async function reverseName(address) {
  return query("name_service", "reverse_resolve", { address });
}

export async function lookupName(name) {
  return query("name_service", "lookup", { name });
}

export async function getNameRecords(name) {
  return query("name_service", "get_records", { name });
}

export async function namesByOwner(address) {
  const result = await query("name_service", "names_by_owner", { address });
  return result?.names ?? [];
}

export async function isNameAvailable(name) {
  const result = await query("name_service", "available", { name });
  return result?.available ?? false;
}

export async function registerName(name) {
  return call("name_service", "register_name", { name });
}

export async function setNameTarget(name, target) {
  return call("name_service", "set_target", { name, target });
}

export async function setNameRecord(name, key, value) {
  return call("name_service", "set_record", { name, key, value });
}

export async function renewName(name) {
  return call("name_service", "renew", { name });
}

export async function transferName(name, newOwner) {
  return call("name_service", "transfer_name", { name, new_owner: newOwner });
}

export async function releaseName(name) {
  return call("name_service", "release", { name });
}

// ── Credentials ──────────────────────────────────────────────────────

export async function listCredentials(address) {
  const result = await query("credential", "list_by_holder", { address });
  return result?.credentials ?? [];
}

export async function getCredential(commitment) {
  return query("credential", "get_credential", { commitment });
}

export async function getSchema(schemaHash) {
  return query("credential", "get_schema", { schema_hash: schemaHash });
}

export async function verifyProof(proof) {
  return query("credential", "verify", proof);
}

// ── Profile helpers ──────────────────────────────────────────────────

const PROFILE_FIELDS = [
  { key: "display_name", label: "Display Name", placeholder: "Alice" },
  { key: "avatar", label: "Avatar URL", placeholder: "https://..." },
  { key: "bio", label: "Bio", placeholder: "Short description" },
  { key: "email", label: "Email", placeholder: "alice@example.com" },
  { key: "website", label: "Website", placeholder: "https://..." },
  { key: "twitter", label: "Twitter", placeholder: "@handle" },
  { key: "github", label: "GitHub", placeholder: "username" },
];

export { PROFILE_FIELDS };
