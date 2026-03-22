import { useState } from "preact/hooks";

export function PasswordSetupScreen({ onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(password);
    } catch (e) {
      setError(e.message ?? "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div class="screen-scroll">
      <div class="stack stack-lg" style={{ paddingTop: 32, maxWidth: 300, margin: "0 auto" }}>
        <div class="stack stack-sm text-center">
          <h2 class="text-title">Create a password</h2>
          <p class="text-body">
            This password unlocks your wallet. Your recovery phrase is the only way to restore access if you forget it.
          </p>
        </div>

        <div class="stack stack-md">
          <div class="field">
            <label class="field-label">Password</label>
            <input
              type="password"
              class="input"
              placeholder="At least 8 characters"
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div class="field">
            <label class="field-label">Confirm password</label>
            <input
              type="password"
              class="input"
              placeholder="Confirm password"
              value={confirm}
              onInput={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {error && <p class="text-error text-center">{error}</p>}
          <button class="btn btn-primary" onClick={handleSubmit} disabled={busy}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
