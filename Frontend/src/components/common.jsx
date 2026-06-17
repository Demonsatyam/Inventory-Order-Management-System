import { IconInbox } from "./icons.jsx";

export function Loading() {
  return <div className="spinner" aria-label="Loading" />;
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon || <IconInbox width={32} height={32} />}</div>
      <h4>{title}</h4>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function Badge({ type = "neutral", children, dot }) {
  return (
    <span className={`badge badge--${type}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

// Money formatter (₹ — Indian Rupee, matching the backend sample data).
export function money(value) {
  const n = Number(value || 0);
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
