/**
 * Provider method dispatch table.
 *
 * Each handler receives (ctx) with:
 *   ctx.origin, ctx.method, ctx.params, ctx.wallet, ctx.snapshot, ctx.settings
 *
 * Returns the result to send back to the page, or throws ProviderError.
 */

import { PROVIDER_METHODS } from "./constants.js";

// Import all handlers by domain
import { handleConnect, handleDisconnect, handleSwitchChain, handleAddChain, handleAccounts, handleChainId, handlePermissions, handleRequestPermissions } from "./handlers/connection.js";
import { handleGetNonce, handleGetBalance, handleGetPublicKey, handleGetNetworkInfo, handleGetReceipt, handleGetTransactionHistory } from "./handlers/queries.js";
import { handleSignMessage, handleSignPayload, handleBuildOwnershipProof } from "./handlers/signing.js";
import { handleSendTransaction, handleCallContract, handleQueryContract, handleSimulateCall, handleEstimateGas } from "./handlers/transactions.js";
import { handleShieldedBalance, handleShieldedDeposit, handleShieldedWithdraw, handleShieldedComplianceProof } from "./handlers/shielded.js";

const METHOD_MAP = {
  [PROVIDER_METHODS.CONNECT]: handleConnect,
  [PROVIDER_METHODS.DISCONNECT]: handleDisconnect,
  [PROVIDER_METHODS.SWITCH_CHAIN]: handleSwitchChain,
  [PROVIDER_METHODS.ADD_CHAIN]: handleAddChain,
  [PROVIDER_METHODS.ACCOUNTS]: handleAccounts,
  [PROVIDER_METHODS.CHAIN_ID]: handleChainId,
  [PROVIDER_METHODS.GET_PERMISSIONS]: handlePermissions,
  [PROVIDER_METHODS.REQUEST_PERMISSIONS]: handleRequestPermissions,
  [PROVIDER_METHODS.GET_NONCE]: handleGetNonce,
  [PROVIDER_METHODS.GET_BALANCE]: handleGetBalance,
  [PROVIDER_METHODS.GET_PUBLIC_KEY]: handleGetPublicKey,
  [PROVIDER_METHODS.GET_NETWORK_INFO]: handleGetNetworkInfo,
  [PROVIDER_METHODS.GET_RECEIPT]: handleGetReceipt,
  [PROVIDER_METHODS.GET_TRANSACTION_HISTORY]: handleGetTransactionHistory,
  [PROVIDER_METHODS.SIGN_MESSAGE]: handleSignMessage,
  [PROVIDER_METHODS.SIGN_PAYLOAD]: handleSignPayload,
  [PROVIDER_METHODS.BUILD_OWNERSHIP_PROOF]: handleBuildOwnershipProof,
  [PROVIDER_METHODS.SEND_TRANSACTION]: handleSendTransaction,
  [PROVIDER_METHODS.CALL_CONTRACT]: handleCallContract,
  [PROVIDER_METHODS.QUERY_CONTRACT]: handleQueryContract,
  [PROVIDER_METHODS.SIMULATE_CALL]: handleSimulateCall,
  [PROVIDER_METHODS.ESTIMATE_GAS]: handleEstimateGas,
  [PROVIDER_METHODS.SHIELDED_BALANCE]: handleShieldedBalance,
  [PROVIDER_METHODS.SHIELDED_DEPOSIT]: handleShieldedDeposit,
  [PROVIDER_METHODS.SHIELDED_WITHDRAW]: handleShieldedWithdraw,
  [PROVIDER_METHODS.SHIELDED_COMPLIANCE_PROOF]: handleShieldedComplianceProof,
};

export function getMethodHandler(method) {
  return METHOD_MAP[method] ?? null;
}
