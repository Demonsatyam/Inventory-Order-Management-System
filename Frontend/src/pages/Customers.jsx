import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, EmptyState } from "../components/common.jsx";
import { IconPlus, IconTrash, IconUsers } from "../components/icons.jsx";

const empty = { full_name: "", email: "", phone: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Customers() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setCustomers(await api.getCustomers());
    } catch (e) {
      toast.error("Failed to load customers", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const openCreate = () => {
    setForm(empty);
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const body = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
    };
    try {
      await api.createCustomer(body);
      toast.success("Customer added", `${body.full_name} was created.`);
      setShowForm(false);
      load();
    } catch (e) {
      if (e.status === 409) setErrors({ email: e.message });
      toast.error("Could not add customer", e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteCustomer(toDelete.id);
      toast.success("Customer deleted", `${toDelete.full_name} was removed.`);
      setToDelete(null);
      load();
    } catch (e) {
      toast.error("Could not delete", e.message);
    } finally {
      setDeleting(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const initials = (name) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <>
      <div className="page-head">
        <div>
          <h3>Customers</h3>
          <p>{customers.length} customer{customers.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <IconPlus /> Add Customer
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<IconUsers width={32} height={32} />}
            title="No customers yet"
            message="Add your first customer to start creating orders."
            action={
              <button className="btn btn--primary" onClick={openCreate}>
                <IconPlus /> Add Customer
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th className="t-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div className="avatar__circle" style={{ width: 34, height: 34, fontSize: 12 }}>
                          {initials(c.full_name)}
                        </div>
                        <span className="t-strong">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="t-muted">{c.email}</td>
                    <td className="t-muted">{c.phone || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-icon btn-icon--danger"
                          onClick={() => setToDelete(c)}
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
        <Modal
          title="Add Customer"
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : "Create Customer"}
              </button>
            </>
          }
        >
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>
                Full Name <span className="req">*</span>
              </label>
              <input
                className={`input ${errors.full_name ? "input--error" : ""}`}
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="e.g. John Doe"
              />
              {errors.full_name && <span className="field__error">{errors.full_name}</span>}
            </div>

            <div className="field">
              <label>
                Email <span className="req">*</span>
              </label>
              <input
                className={`input ${errors.email ? "input--error" : ""}`}
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="e.g. john@example.com"
              />
              {errors.email && <span className="field__error">{errors.email}</span>}
              <span className="field__hint">Must be unique across all customers.</span>
            </div>

            <div className="field">
              <label>Phone Number</label>
              <input
                className="input"
                value={form.phone}
                onChange={set("phone")}
                placeholder="e.g. 9876543210"
              />
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete customer?"
          message={`"${toDelete.full_name}" will be permanently removed. This cannot be undone.`}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
          busy={deleting}
        />
      )}
    </>
  );
}
