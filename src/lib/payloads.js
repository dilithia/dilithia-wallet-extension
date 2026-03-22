function normalizePlainObject(value) {
  if (Array.isArray(value)) {
    return value.map(normalizePlainObject);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizePlainObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function canonicalizePayload(payload) {
  return normalizePlainObject(payload);
}

export function canonicalPayloadJson(payload) {
  return JSON.stringify(canonicalizePayload(payload));
}

export function buildOwnershipProofPayload({
  origin,
  chainId,
  address,
  publicKey,
  challenge,
  issuedAt,
  expiresAt,
  statement = "DiliScan ownership verification",
}) {
  return canonicalizePayload({
    kind: "diliscan.ownership_proof",
    version: 1,
    origin,
    chain_id: chainId,
    address,
    public_key: publicKey,
    challenge,
    statement,
    issued_at: issuedAt ?? new Date().toISOString(),
    expires_at: expiresAt ?? null,
  });
}
