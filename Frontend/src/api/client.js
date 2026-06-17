// Thin fetch wrapper around the FastAPI backend.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (e) {
    throw new ApiError(
      "Cannot reach the server. Is the backend running?",
      0
    );
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractError(data, res.status), res.status, data);
  }
  return data;
}

// FastAPI returns either {detail: "..."} or {detail: [{msg, loc}, ...]} (422)
function extractError(data, status) {
  if (data && typeof data === "object") {
    const d = data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((e) => {
          const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : "";
          return field ? `${field}: ${e.msg}` : e.msg;
        })
        .join(", ");
    }
  }
  return `Request failed (${status})`;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = {
  base: BASE_URL,

  // Dashboard
  getDashboard: () => request("/dashboard"),

  // Products
  getProducts: () => request("/products"),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) =>
    request("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // Customers
  getCustomers: () => request("/customers"),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (body) =>
    request("/customers", { method: "POST", body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  // Orders
  getOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (body) =>
    request("/orders", { method: "POST", body: JSON.stringify(body) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: "DELETE" }),
};
