const DEFAULT_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function validateRpcUrl(rpcUrl) {
  try {
    const url = new URL(rpcUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid RPC URL protocol");
    }
    return url.href;
  } catch {
    throw new Error(`Invalid RPC URL: ${rpcUrl}`);
  }
}

async function jsonRpc(rpcUrl, method, params = {}) {
  const url = validateRpcUrl(rpcUrl);
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `wallet-${method}`,
      method,
      params,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${method} failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message ?? `${method} failed.`);
  }

  return payload.result;
}

export async function getBalance(rpcUrl, address) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const response = await fetchWithTimeout(`${baseUrl}/balance/${encodeURIComponent(address)}`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Balance lookup failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

export async function getAddressSummary(rpcUrl, address) {
  return (await jsonRpc(rpcUrl, "qsc_addressSummary", { address })) ?? {};
}

export async function getAddressTxs(rpcUrl, address) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const response = await fetchWithTimeout(`${baseUrl}/address/${encodeURIComponent(address)}/txs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Address tx lookup failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return response.json();
}

export async function simulateCall(rpcUrl, call) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const response = await fetchWithTimeout(`${baseUrl}/simulate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(call),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Simulation failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return response.json();
}

export async function getNextNonce(rpcUrl, address) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const response = await fetchWithTimeout(`${baseUrl}/nonce/${encodeURIComponent(address)}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Nonce lookup failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

export async function submitCall(rpcUrl, payload) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const response = await fetchWithTimeout(`${baseUrl}/call`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Transaction submit failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

export async function getReceipt(rpcUrl, txHash) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const response = await fetchWithTimeout(`${baseUrl}/receipt/${encodeURIComponent(txHash)}`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Receipt lookup failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

export async function getHead(rpcUrl, confirmed = false) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const suffix = confirmed ? "?confirmed=true" : "";
  const response = await fetchWithTimeout(`${baseUrl}/head${suffix}`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Head lookup failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

export async function getBaseFee(rpcUrl) {
  return await jsonRpc(rpcUrl, "qsc_baseFee", {});
}

export async function queryContract(rpcUrl, contract, method, args = {}) {
  return await jsonRpc(rpcUrl, "qsc_query", { contract, method, args });
}

export async function estimateGas(rpcUrl, call) {
  const simulation = await simulateCall(rpcUrl, call);
  const head = await getHead(rpcUrl).catch(() => ({}));
  const baseFee = Number(head.base_fee ?? 0);
  const gasUsed = Number(simulation.gas_used ?? 0);
  return {
    gasLimit: gasUsed > 0 ? gasUsed : 0,
    baseFee,
    estimatedCost: gasUsed * baseFee,
    simulation,
  };
}

export async function getNetworkInfo(rpcUrl, settings) {
  const head = await getHead(rpcUrl).catch(() => ({}));
  const baseFeePayload = await getBaseFee(rpcUrl).catch(() => ({}));
  return {
    chainId: settings.chainId,
    blockHeight: Number(head.height ?? 0),
    baseFee: Number(baseFeePayload.base_fee ?? head.base_fee ?? 0),
    networkId: settings.network?.id ?? settings.networkId,
    networkLabel: settings.network?.label ?? null,
  };
}

export async function shieldedPoolInfo(rpcUrl) {
  const baseUrl = rpcUrl.replace(/\/rpc\/?$/, "");
  const response = await fetchWithTimeout(`${baseUrl}/shielded/pool`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Shielded pool lookup failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return response.json();
}

export async function shieldedCommitmentExists(rpcUrl, commitment) {
  return await jsonRpc(rpcUrl, "qsc_shieldedCommitment", { commitment });
}

export async function shieldedNullifierSpent(rpcUrl, nullifier) {
  return await jsonRpc(rpcUrl, "qsc_shieldedNullifier", { nullifier });
}
