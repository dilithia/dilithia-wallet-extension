import { useEffect, useRef } from "preact/hooks";

/**
 * Apple-style modal dialog. Renders a centered card over a dimmed backdrop.
 * Closes on backdrop tap or Escape key.
 */
export function Dialog({ open, onClose, title, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div class="dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="dialog-card" ref={ref}>
        {title && <h3 class="dialog-title">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

/**
 * Single text input dialog — replaces window.prompt.
 */
export function PromptDialog({ open, onClose, onSubmit, title, label, placeholder, defaultValue, buttonLabel }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.value = defaultValue ?? "";
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  const handleSubmit = () => {
    const val = inputRef.current?.value?.trim();
    if (val) onSubmit(val);
  };

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div class="stack stack-md" style={{ paddingTop: 8 }}>
        {label && <label class="field-label">{label}</label>}
        <input
          ref={inputRef}
          class="input"
          placeholder={placeholder ?? ""}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button class="btn btn-subtle" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button class="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>{buttonLabel ?? "OK"}</button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Confirm dialog — replaces window.confirm.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, danger }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div class="stack stack-md" style={{ paddingTop: 8 }}>
        {message && <p class="text-body">{message}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button class="btn btn-subtle" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            class={danger ? "btn btn-danger" : "btn btn-primary"}
            style={{ flex: 1 }}
            onClick={() => { onConfirm(); onClose(); }}
          >{confirmLabel ?? "Confirm"}</button>
        </div>
      </div>
    </Dialog>
  );
}
