import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { Loading, EmptyState, Badge, money } from "../components/common.jsx";
import { IconPlus, IconEdit, IconTrash, IconBox } from "../components/icons.jsx";

const LOW_STOCK = 10;
const empty = { name: "", sku: "", price: "", stock_quantity: "" };

export default function Products() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setProducts(await api.getProducts());
    } catch (e) {
      toast.error("Failed to load products", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      stock_quantity: String(p.stock_quantity),
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.price === "" || Number(form.price) <= 0)
      e.price = "Price must be greater than 0";
    if (form.stock_quantity === "" || Number(form.stock_quantity) < 0)
      e.stock_quantity = "Stock cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
    };
    try {
      if (editing) {
        await api.updateProduct(editing.id, body);
        toast.success("Product updated", `${body.name} was saved.`);
      } else {
        await api.createProduct(body);
        toast.success("Product created", `${body.name} was added.`);
      }
      setShowForm(false);
      load();
    } catch (e) {
      if (e.status === 409) setErrors({ sku: e.message });
      toast.error("Could not save product", e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteProduct(toDelete.id);
      toast.success("Product deleted", `${toDelete.name} was removed.`);
      setToDelete(null);
      load();
    } catch (e) {
      toast.error("Could not delete", e.message);
    } finally {
      setDeleting(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="page-head">
        <div>
          <h3>Products</h3>
          <p>{products.length} product{products.length !== 1 ? "s" : ""} in catalogue</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <IconPlus /> Add Product
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<IconBox width={32} height={32} />}
            title="No products yet"
            message="Add your first product to start tracking inventory."
            action={
              <button className="btn btn--primary" onClick={openCreate}>
                <IconPlus /> Add Product
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th className="t-right">Price</th>
                  <th>Stock</th>
                  <th className="t-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="t-strong">{p.name}</td>
                    <td>
                      <span className="t-mono">{p.sku}</span>
                    </td>
                    <td className="t-right t-strong">{money(p.price)}</td>
                    <td>
                      <Badge
                        type={
                          p.stock_quantity === 0
                            ? "error"
                            : p.stock_quantity < LOW_STOCK
                            ? "warning"
                            : "success"
                        }
                        dot
                      >
                        {p.stock_quantity} in stock
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-icon btn-icon--edit"
                          onClick={() => openEdit(p)}
                          aria-label="Edit"
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="btn-icon btn-icon--danger"
                          onClick={() => setToDelete(p)}
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
          title={editing ? "Edit Product" : "Add Product"}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Product"}
              </button>
            </>
          }
        >
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>
                Product Name <span className="req">*</span>
              </label>
              <input
                className={`input ${errors.name ? "input--error" : ""}`}
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Wireless Mouse"
              />
              {errors.name && <span className="field__error">{errors.name}</span>}
            </div>

            <div className="field">
              <label>
                SKU <span className="req">*</span>
              </label>
              <input
                className={`input ${errors.sku ? "input--error" : ""}`}
                value={form.sku}
                onChange={set("sku")}
                placeholder="e.g. MOU001"
              />
              {errors.sku && <span className="field__error">{errors.sku}</span>}
              <span className="field__hint">Must be unique across all products.</span>
            </div>

            <div className="form-grid form-grid--2">
              <div className="field">
                <label>
                  Price <span className="req">*</span>
                </label>
                <div className="input-prefix">
                  <span>₹</span>
                  <input
                    className={`input ${errors.price ? "input--error" : ""}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={set("price")}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <span className="field__error">{errors.price}</span>}
              </div>

              <div className="field">
                <label>
                  Quantity <span className="req">*</span>
                </label>
                <input
                  className={`input ${errors.stock_quantity ? "input--error" : ""}`}
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock_quantity}
                  onChange={set("stock_quantity")}
                  placeholder="0"
                />
                {errors.stock_quantity && (
                  <span className="field__error">{errors.stock_quantity}</span>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete product?"
          message={`"${toDelete.name}" will be permanently removed. This cannot be undone.`}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
          busy={deleting}
        />
      )}
    </>
  );
}
