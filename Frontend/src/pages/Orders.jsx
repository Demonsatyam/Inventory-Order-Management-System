import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, EmptyState, Badge, money, formatDate } from "../components/common.jsx";
import {
  IconPlus,
  IconTrash,
  IconEye,
  IconCart,
  IconX,
} from "../components/icons.jsx";

export default function Orders() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const [o, c, p] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getProducts(),
      ]);
      setOrders(o);
      setCustomers(c);
      setProducts(p);
    } catch (e) {
      toast.error("Failed to load orders", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const productName = (id) => products.find((p) => p.id === id)?.name || `#${id}`;
  const customerName = (id) =>
    customers.find((c) => c.id === id)?.full_name || `Customer #${id}`;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteOrder(toDelete.id);
      toast.success("Order cancelled", `Order #${toDelete.id} removed, stock restored.`);
      setToDelete(null);
      load();
    } catch (e) {
      toast.error("Could not cancel order", e.message);
    } finally {
      setDeleting(false);
    }
  };

  const onCreated = () => {
    setShowForm(false);
    load();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h3>Orders</h3>
          <p>{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowForm(true)}
          disabled={customers.length === 0 || products.length === 0}
          title={
            customers.length === 0 || products.length === 0
              ? "Add at least one customer and product first"
              : ""
          }
        >
          <IconPlus /> Create Order
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<IconCart width={32} height={32} />}
            title="No orders yet"
            message={
              customers.length === 0 || products.length === 0
                ? "Add customers and products before creating an order."
                : "Create your first order to get started."
            }
            action={
              customers.length > 0 &&
              products.length > 0 && (
                <button className="btn btn--primary" onClick={() => setShowForm(true)}>
                  <IconPlus /> Create Order
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th className="t-right">Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="t-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...orders]
                  .sort((a, b) => b.id - a.id)
                  .map((o) => (
                    <tr key={o.id}>
                      <td className="t-strong">#{o.id}</td>
                      <td>{customerName(o.customer_id)}</td>
                      <td className="t-muted">
                        {o.items?.reduce((s, i) => s + i.quantity, 0)} item
                        {o.items?.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                        <span style={{ color: "var(--text-low)" }}>
                          {" "}
                          · {productName(o.items?.[0]?.product_id)}
                          {o.items?.length > 1 ? ` +${o.items.length - 1}` : ""}
                        </span>
                      </td>
                      <td className="t-right t-strong">{money(o.total_amount)}</td>
                      <td>
                        <Badge type="success" dot>
                          Completed
                        </Badge>
                      </td>
                      <td className="t-muted">{formatDate(o.created_at)}</td>
                      <td>
                        <div className="row-actions">
                          <Link
                            to={`/orders/${o.id}`}
                            className="btn-icon btn-icon--view"
                            aria-label="View"
                          >
                            <IconEye />
                          </Link>
                          <button
                            className="btn-icon btn-icon--danger"
                            onClick={() => setToDelete(o)}
                            aria-label="Delete"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CreateOrder
          customers={customers}
          products={products}
          onClose={() => setShowForm(false)}
          onCreated={onCreated}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Cancel order?"
          message={`Order #${toDelete.id} will be deleted and its stock restored to inventory.`}
          confirmLabel="Cancel Order"
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
          busy={deleting}
        />
      )}
    </>
  );
}

/* ---------------- Create Order modal ---------------- */
function CreateOrder({ customers, products, onClose, onCreated }) {
  const toast = useToast();
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([]); // [{product_id, quantity}]
  const [picker, setPicker] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const available = products.filter((p) => !lines.some((l) => l.product_id === p.id));

  const addLine = (id) => {
    if (!id) return;
    setLines((l) => [...l, { product_id: Number(id), quantity: 1 }]);
    setPicker("");
  };

  const setQty = (id, qty) =>
    setLines((l) =>
      l.map((x) => (x.product_id === id ? { ...x, quantity: qty } : x))
    );

  const removeLine = (id) =>
    setLines((l) => l.filter((x) => x.product_id !== id));

  const total = lines.reduce((sum, l) => {
    const p = productById[l.product_id];
    return sum + (p ? Number(p.price) * (Number(l.quantity) || 0) : 0);
  }, 0);

  const submit = async () => {
    setError("");
    if (!customerId) return setError("Please select a customer.");
    if (lines.length === 0) return setError("Add at least one product.");

    for (const l of lines) {
      const p = productById[l.product_id];
      if (!l.quantity || l.quantity < 1)
        return setError(`Quantity for "${p.name}" must be at least 1.`);
      if (l.quantity > p.stock_quantity)
        return setError(
          `Only ${p.stock_quantity} of "${p.name}" in stock (requested ${l.quantity}).`
        );
    }

    setSubmitting(true);
    try {
      const order = await api.createOrder({
        customer_id: Number(customerId),
        items: lines.map((l) => ({
          product_id: l.product_id,
          quantity: Number(l.quantity),
        })),
      });
      toast.success("Order created", `Order #${order.id} placed for ${money(order.total_amount)}.`);
      onCreated();
    } catch (e) {
      setError(e.message);
      toast.error("Could not create order", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Create Order"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={submitting}>
            {submitting ? "Placing…" : `Submit Order · ${money(total)}`}
          </button>
        </>
      }
    >
      {error && (
        <div
          className="badge badge--error"
          style={{
            width: "100%",
            justifyContent: "flex-start",
            padding: "10px 14px",
            marginBottom: 16,
            borderRadius: "var(--radius-sm)",
          }}
        >
          {error}
        </div>
      )}

      <div className="field" style={{ marginBottom: 18 }}>
        <label>
          Select Customer <span className="req">*</span>
        </label>
        <select
          className="select"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">— Choose a customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} ({c.email})
            </option>
          ))}
        </select>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label>Add Products</label>
        <select
          className="select"
          value={picker}
          onChange={(e) => addLine(e.target.value)}
          disabled={available.length === 0}
        >
          <option value="">
            {available.length === 0 ? "All products added" : "— Select a product to add —"}
          </option>
          {available.map((p) => (
            <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
              {p.name} · {money(p.price)} ({p.stock_quantity} in stock)
            </option>
          ))}
        </select>
      </div>

      {lines.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px",
            color: "var(--text-low)",
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
          }}
        >
          No products added yet.
        </div>
      ) : (
        <div>
          {lines.map((l) => {
            const p = productById[l.product_id];
            const sub = Number(p.price) * (Number(l.quantity) || 0);
            const over = l.quantity > p.stock_quantity;
            return (
              <div className="line-item" key={l.product_id}>
                <div className="line-item__name">
                  <strong>{p.name}</strong>
                  <span>
                    {money(p.price)} · {p.stock_quantity} in stock
                  </span>
                </div>
                <input
                  className={`input ${over ? "input--error" : ""}`}
                  type="number"
                  min="1"
                  max={p.stock_quantity}
                  value={l.quantity}
                  onChange={(e) =>
                    setQty(l.product_id, e.target.value === "" ? "" : Number(e.target.value))
                  }
                  style={{ padding: "8px 10px" }}
                />
                <div className="line-item__price t-right t-strong">{money(sub)}</div>
                <button
                  className="btn-icon btn-icon--danger"
                  onClick={() => removeLine(l.product_id)}
                  aria-label="Remove"
                >
                  <IconX />
                </button>
              </div>
            );
          })}

          <div style={{ marginTop: 12 }}>
            <div className="summary-row">
              <span>Items</span>
              <span>{lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0)}</span>
            </div>
            <div className="summary-row summary-row--total">
              <span>Total Amount</span>
              <span>{money(total)}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
