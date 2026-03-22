import { useState, useEffect, useCallback } from "preact/hooks";
import { namesByOwner, getNameRecords, listCredentials, reverseName } from "../lib/identity-model.js";

/**
 * Hook: identity data for an address — names, records, credentials.
 */
export function useIdentity(address) {
  const [names, setNames] = useState([]);
  const [primaryName, setPrimaryName] = useState(null);
  const [records, setRecords] = useState({});
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!address) { setLoading(false); return; }
    try {
      const [ownedNames, creds, reverse] = await Promise.all([
        namesByOwner(address).catch(() => []),
        listCredentials(address).catch(() => []),
        reverseName(address).catch(() => null),
      ]);

      setNames(ownedNames);
      setCredentials(creds);

      // Primary name: reverse lookup or first owned
      const primary = reverse?.name ?? (ownedNames.length > 0 ? ownedNames[0]?.name ?? ownedNames[0] : null);
      setPrimaryName(primary);

      // Load records for primary name
      if (primary) {
        const recs = await getNameRecords(primary).catch(() => ({}));
        setRecords(recs?.records ?? recs ?? {});
      } else {
        setRecords({});
      }

      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => { load(); }, [load]);

  return { names, primaryName, records, credentials, loading, error, refresh: load };
}
