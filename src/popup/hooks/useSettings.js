import { useState, useEffect } from "preact/hooks";

const SETTINGS_KEY = "dilithia.settings";

export function useSettings() {
  const [settings, setSettingsState] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(SETTINGS_KEY).then((data) => {
      setSettingsState(data[SETTINGS_KEY] ?? {});
    });

    const listener = (changes, area) => {
      if (area === "local" && changes[SETTINGS_KEY]) {
        setSettingsState(changes[SETTINGS_KEY].newValue ?? {});
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return settings;
}
