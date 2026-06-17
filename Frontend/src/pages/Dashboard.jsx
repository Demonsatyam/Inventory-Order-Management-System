import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import {
  IconBox,
  IconUsers,
  IconCart,
  IconAlert,
  IconEye,
} from "../components/icons.jsx";
import { Loading, EmptyState, Badge, money, formatDate } from "../components/common.jsx";

const LOW_STOCK = 10;

const STAT_META = [
  { key: "total_products", label: "Total Products", icon: IconBox, color: "var(--primary)", bg: "var(--primary-lightest)" },
  { key: "total_customers", label: "Total Customers", icon: IconUsers, color: "var(--secondary)", bg: "var(--secondary-lightest)" },
  { key: "total_orders", label: "Total Orders", icon: IconCart, color: "var(--info)", bg: "#e6f1ff" },
  { key: "low_stock_products", label: "Low Stock Products", icon: IconAlert, color: "var(--warning)", bg: "#fff1e0" },
];

export default function Dashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, o, p, c] = await Promise.all([
          api.getDashboard(),
          api.getOrders(),
          api.getProducts(),
          api.getCustomers(),
        ]);
        setStats(s);
        setOrders(o);
        setProducts(p);
        setCustomers(c);
      } catch (e) {
        toast.error("Failed to load dashboard", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  if (loading) return <Loading />;

  const customerName = (id) => {
    const c = customers.find((x) => x.id === id);
    return c ? c.full_name : `Customer #${id}`;
  };

  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 6);
  const lowStock = products
    .filter((p) => p.stock_quantity < LOW_STOCK)
    .sort((a, b) => a.stock_quantity - b.stock_quantity);

  return (
    <>
      <div className="stat-grid">
        {STAT_META.map(({ key, label, icon: Icon, color, bg }) => (
          <div className="stat" key={key}>
            <div className="stat__icon" style={{ background: bg, color }}>
              <Icon />
            </div>
            <div className="stat__value">{stats?.[key] ?? 0}</div>
            <div className="stat__label">{label}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* Recent orders */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 20px",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <h3 className="section-title" style={{ margin: 0 }}>
              <IconCart width={18} height={18} style={{ color: "var(--primary)" }} />
              Recent Orders
            </h3>
            <Link to="/orders" className="btn btn--ghost" style={{ padding: "7px 14px" }}>
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              message="Orders created in the system will appear here."
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th className="t-right">Total</th>
                    <th className="t-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="t-strong">#{o.id}</td>
                      <td>{customerName(o.customer_id)}</td>
                      <td className="t-muted">{formatDate(o.created_at)}</td>
                      <td className="t-right t-strong">{money(o.total_amount)}</td>
                      <td className="t-right">
                        <Link to={`/orders/${o.id}`} className="btn-icon btn-icon--view">
                          <IconEye />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock alert */}
        <div className="card card--pad">
          <h3 className="section-title">
            <IconAlert width={18} height={18} style={{ color: "var(--warning)" }} />
            Low Stock Alerts
          </h3>
          {lowStock.length === 0 ? (
            <EmptyState
              icon={<IconBox width={30} height={30} />}
              title="All stocked up"
              message="No products are below the low-stock threshold."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lowStock.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13.5 }}>{p.name}</strong>
                    <div className="t-muted" style={{ fontSize: 11.5 }}>
                      SKU {p.sku}
                    </div>
                  </div>
                  <Badge type={p.stock_quantity === 0 ? "error" : "warning"} dot>
                    {p.stock_quantity} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
