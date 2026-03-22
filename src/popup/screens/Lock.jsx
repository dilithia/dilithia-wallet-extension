import { useState } from "preact/hooks";

export function LockScreen({ onUnlock, onForgot }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleUnlock = async () => {
    if (!password) { setError("Enter your password"); return; }
    setBusy(true);
    setError(null);
    const result = await onUnlock(password);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
  };

  return (
    <div class="screen-centered">
      <svg viewBox="0 0 100 100" width="48" height="48" class="lock-icon">
        <path fill="currentColor" d="M49 1.9c-8 .3-17 3.5-24 9.1-7 6-5 26-5 26H10v42c0 16 12 19 21 19h39c12 0 22-8 22-17V37H82s2-18-4-24C70 5.5 61 2 51 1.9zm1 7.7c8-.1 16 2.4 21 8.4 3 4 3 19 3 19H28s-1-16 3-20c4-5 11-7.2 19-7.4M50 49c3 0 6 1 8 4 4 6-3 12-3 12l5 20H41l5-20s-1-1-3-4c-2-4-1-7 2-10 1-1 3-2 5-2"/>
      </svg>

      <h2 class="text-title" style={{ marginTop: 12 }}>Welcome back</h2>

      <div class="stack stack-md w-full" style={{ maxWidth: 260, marginTop: 32 }}>
        <input
          type="password"
          class="input input-center"
          placeholder="Enter password"
          value={password}
          onInput={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          autoFocus
        />
        {error && <p class="text-error text-center">{error}</p>}
        <button class="btn btn-primary" onClick={handleUnlock} disabled={busy}>
          Unlock
        </button>
      </div>

      <button class="btn-link" style={{ marginTop: 24 }} onClick={onForgot}>
        Forgot password? Reset with recovery phrase
      </button>
    </div>
  );
}
