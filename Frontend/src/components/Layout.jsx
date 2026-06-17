import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  IconDashboard,
  IconBox,
  IconUsers,
  IconCart,
  IconMenu,
  IconBell,
  IconSearch,
} from "./icons.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
  { to: "/products", label: "Products", icon: IconBox },
  { to: "/customers", label: "Customers", icon: IconUsers },
  { to: "/orders", label: "Orders", icon: IconCart },
];

const TITLES = {
  "/": { h: "Dashboard", p: "Overview of your inventory and orders" },
  "/products": { h: "Products", p: "Manage your product catalogue" },
  "/customers": { h: "Customers", p: "Manage your customer records" },
  "/orders": { h: "Orders", p: "Create and track customer orders" },
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const meta =
    TITLES[location.pathname] ||
    (location.pathname.startsWith("/orders")
      ? { h: "Order Details", p: "Full breakdown of the selected order" }
      : { h: "", p: "" });

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <IconBox width={20} height={20} stroke="#fff" />
          </div>
          <div>
            <h1>InventoryOS</h1>
            <span>Order Management</span>
          </div>
        </div>

        <nav className="nav">
          <span className="nav__label">Menu</span>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav__item ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__foot">© 2026 InventoryOS</div>
      </aside>

      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="icon-btn hamburger"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <IconMenu width={22} height={22} />
            </button>
            <div className="topbar__title">
              <h2>{meta.h}</h2>
              <p>{meta.p}</p>
            </div>
          </div>

          <div className="topbar__right">
            <button className="icon-btn" aria-label="Search">
              <IconSearch width={20} height={20} />
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <IconBell width={20} height={20} />
            </button>
            <div className="avatar">
              <div className="avatar__circle">AD</div>
              <div className="avatar__meta">
                <strong>Admin</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
