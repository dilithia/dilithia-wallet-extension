import { useState } from "preact/hooks";
import { MultisigListScreen } from "./MultisigList.jsx";
import { MultisigDetailScreen } from "./MultisigDetail.jsx";
import { MultisigTxDetailScreen } from "./MultisigTxDetail.jsx";
import { MultisigProposeScreen } from "./MultisigPropose.jsx";
import { MultisigCreateScreen } from "./MultisigCreate.jsx";

/**
 * Multisig screen router — manages its own navigation stack.
 * Entry from More → "Multisig" or Settings → "Multisig".
 */
export function MultisigRouter({ address, onBack }) {
  // Navigation stack: [{ screen, props }]
  const [stack, setStack] = useState([{ screen: "list" }]);
  const current = stack[stack.length - 1];

  const push = (screen, props = {}) => setStack([...stack, { screen, ...props }]);
  const pop = () => {
    if (stack.length <= 1) { onBack(); return; }
    setStack(stack.slice(0, -1));
  };

  switch (current.screen) {
    case "list":
      return (
        <MultisigListScreen
          address={address}
          onBack={onBack}
          onSelect={(walletId) => push("detail", { walletId })}
          onCreate={() => push("create")}
        />
      );

    case "detail":
      return (
        <MultisigDetailScreen
          walletId={current.walletId}
          myAddress={address}
          onBack={pop}
          onTxSelect={(txId) => push("tx", { walletId: current.walletId, txId })}
          onPropose={() => push("propose", { walletId: current.walletId })}
        />
      );

    case "tx":
      return (
        <MultisigTxDetailScreen
          walletId={current.walletId}
          txId={current.txId}
          myAddress={address}
          onBack={pop}
        />
      );

    case "propose":
      return (
        <MultisigProposeScreen
          walletId={current.walletId}
          onBack={pop}
          onProposed={(txId) => {
            // Pop propose, then push tx detail
            const newStack = stack.slice(0, -1);
            setStack([...newStack, { screen: "tx", walletId: current.walletId, txId }]);
          }}
        />
      );

    case "create":
      return (
        <MultisigCreateScreen
          myAddress={address}
          onBack={pop}
          onCreated={(walletId) => {
            // Pop create, then push detail
            const newStack = stack.slice(0, -1);
            setStack([...newStack, { screen: "detail", walletId }]);
          }}
        />
      );

    default:
      return null;
  }
}
