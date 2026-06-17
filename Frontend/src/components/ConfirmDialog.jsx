import Modal from "./Modal.jsx";

export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
  busy,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            disabled={busy}
            style={{ background: "var(--error)", color: "#fff" }}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: "var(--text-mid)", fontSize: 14 }}>{message}</p>
    </Modal>
  );
}
