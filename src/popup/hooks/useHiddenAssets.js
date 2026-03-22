import { useEffect, useState } from "preact/hooks";

const STORAGE_KEY = "dilithia.hiddenAssets";

export function useHiddenAssets(address) {
  const [hidden, setHidden] = useState({ tokens: [], nfts: [] });

  useEffect(() => {
    if (!address) return;
    chrome.storage.local.get(STORAGE_KEY).then((data) => {
      const all = data[STORAGE_KEY] ?? {};
      setHidden(all[address] ?? { tokens: [], nfts: [] });
    });

    const listener = (changes, area) => {
      if (area === "local" && changes[STORAGE_KEY]) {
        const all = changes[STORAGE_KEY].newValue ?? {};
        setHidden(all[address] ?? { tokens: [], nfts: [] });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [address]);

  const hideToken = (contract) => {
    chrome.storage.local.get(STORAGE_KEY).then((data) => {
      const all = data[STORAGE_KEY] ?? {};
      const entry = all[address] ?? { tokens: [], nfts: [] };
      if (!entry.tokens.includes(contract)) {
        entry.tokens = [...entry.tokens, contract];
      }
      all[address] = entry;
      chrome.storage.local.set({ [STORAGE_KEY]: all });
    });
  };

  const showToken = (contract) => {
    chrome.storage.local.get(STORAGE_KEY).then((data) => {
      const all = data[STORAGE_KEY] ?? {};
      const entry = all[address] ?? { tokens: [], nfts: [] };
      entry.tokens = entry.tokens.filter((c) => c !== contract);
      all[address] = entry;
      chrome.storage.local.set({ [STORAGE_KEY]: all });
    });
  };

  const hideNft = (contract) => {
    chrome.storage.local.get(STORAGE_KEY).then((data) => {
      const all = data[STORAGE_KEY] ?? {};
      const entry = all[address] ?? { tokens: [], nfts: [] };
      if (!entry.nfts.includes(contract)) {
        entry.nfts = [...entry.nfts, contract];
      }
      all[address] = entry;
      chrome.storage.local.set({ [STORAGE_KEY]: all });
    });
  };

  const showNft = (contract) => {
    chrome.storage.local.get(STORAGE_KEY).then((data) => {
      const all = data[STORAGE_KEY] ?? {};
      const entry = all[address] ?? { tokens: [], nfts: [] };
      entry.nfts = entry.nfts.filter((c) => c !== contract);
      all[address] = entry;
      chrome.storage.local.set({ [STORAGE_KEY]: all });
    });
  };

  const isTokenHidden = (contract) => hidden.tokens.includes(contract);
  const isNftHidden = (contract) => hidden.nfts.includes(contract);

  return { hidden, hideToken, showToken, hideNft, showNft, isTokenHidden, isNftHidden };
}
