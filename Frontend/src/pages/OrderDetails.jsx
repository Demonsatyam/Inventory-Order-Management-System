import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, EmptyState, Badge, money, formatDate } from "../components/common.jsx";
import { IconArrowLeft, IconTrash, IconCart } from "../components/icons.jsx";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const o = await api.getOrder(id);
        setOrder(o);
        const [cust, prods] = await Promise.all([
          api.getCustomer(o.customer_id).catch(() => null),
          api.getProducts(),
        ]);
        setCustomer(cust);
        setProducts(Object.fromEntries(prods.map((p) => [p.id, p])));
      } catch (e) {
        if (e.status === 404) setNotFound(true);
        else toast.error("Failed to load order", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line

  const remove = async () => {
    setDeleting(true);
    try {
      await api.deleteOrder(order.id);
      toast.success("Order cancelled", `Order #${order.id} removed, stock restored.`);
      navigate("/orders");
    } catch (e) {
      toast.error("Could not cancel order", e.message);
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;

  if (notFound)
    return (
      <div className="card">
        <EmptyState
          icon={<IconCart width={32} height={32} />}
          title="Order not found"
          message="This order may have been cancelled or never existed."
          action={
            <Link to="/orders" className="btn btn--primary">
              Back to Orders
            </Link>
          }
        />
      </div>
    );

  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <Link to="/orders" className="back-link">
        <IconArrowLeft width={16} height={16} /> Back to Orders
      </Link>

      <div className="page-head">
        <div>
          <h3>Order #{order.id}</h3>
          <p>Placed on {formatDate(order.created_at)}</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Badge type="success" dot>
            Completed
          </Badge>
          <button className="btn btn--ghost" onClick={() => setConfirm(true)}>
            <IconTrash /> Cancel Order
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card card--pad">
          <h3 className="section-title">Customer Information</h3>
          {customer ? (
            <>
              <div className="kv">
                <span>Full Name</span>
                <strong>{customer.full_name}</strong>
              </div>
              <div className="kv">
                <span>Email</span>
                <strong>{customer.email}</strong>
              </div>
              <div className="kv">
                <span>Phone</span>
                <strong>{customer.phone || "—"}</strong>
              </div>
              <div className="kv">
                <span>Customer ID</span>
                <strong>#{customer.id}</strong>
              </div>
            </>
          ) : (
            <p className="t-muted">Customer record unavailable (#{order.customer_id}).</p>
          )}
        </div>

        <div className="card card--pad">
          <h3 className="section-title">Order Summary</h3>
          <div className="kv">
            <span>Order ID</span>
            <strong>#{order.id}</strong>
          </div>
          <div className="kv">
            <span>Date</span>
            <strong>{formatDate(order.created_at)}</strong>
          </div>
          <div className="kv">
            <span>Total Items</span>
            <strong>{itemCount}</strong>
          </div>
          <div className="kv">
            <span>Status</span>
            <Badge type="success" dot>
              Completed
            </Badge>
          </div>
          <div className="kv" style={{ fontSize: 16 }}>
            <span style={{ fontWeight: 600, color: "var(--text-high)" }}>Total Amount</span>
            <strong style={{ color: "var(--primary)", fontSize: 18 }}>
              {money(order.total_amount)}
            </strong>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title" style={{ padding: "18px 20px 0" }}>
          Ordered Products
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="t-right">Unit Price</th>
                <th className="t-right">Quantity</th>
                <th className="t-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => {
                const p = products[it.product_id];
                return (
                  <tr key={it.id}>
                    <td className="t-strong">{p?.name || `Product #${it.product_id}`}</td>
                    <td>{p ? <span className="t-mono">{p.sku}</span> : "—"}</td>
                    <td className="t-right">{money(it.unit_price)}</td>
                    <td className="t-right">{it.quantity}</td>
                    <td className="t-right t-strong">{money(it.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="t-right t-strong" style={{ borderTop: "2px solid var(--divider)" }}>
                  Total
                </td>
                <td
                  className="t-right t-strong"
                  style={{ borderTop: "2px solid var(--divider)", color: "var(--primary)", fontSize: 15 }}
                >
                  {money(order.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Cancel order?"
          message={`Order #${order.id} will be deleted and its stock restored to inventory.`}
          confirmLabel="Cancel Order"
          onConfirm={remove}
          onClose={() => setConfirm(false)}
          busy={deleting}
        />
      )}
    </>
  );
}
