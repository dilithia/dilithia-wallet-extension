import { useState } from "preact/hooks";
import { NavHeader } from "../components/NavHeader.jsx";

export function ReceiveScreen({ wallet, onBack }) {
  const address = wallet?.address ?? "";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="screen">
      <NavHeader title="Receive" onBack={onBack} />
      <div class="screen-scroll">
        <div class="stack stack-lg" style={{ alignItems: "center", paddingTop: 32 }}>
          <p class="text-body text-center">
            Share your address to receive DILI tokens.
          </p>
          <div class="card w-full" style={{ wordBreak: "break-all", textAlign: "center" }}>
            <p class="text-mono" style={{ fontSize: 13 }}>{address}</p>
          </div>
          <button class="btn btn-subtle" style={{ maxWidth: 200 }} onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Address"}
          </button>
        </div>
      </div>
    </div>
  );
}
