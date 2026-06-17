# Inventory & Order Management System — Frontend

A modern, responsive React (JavaScript) dashboard built with **Vite** and
**React Router**, wired to the FastAPI backend.

## Screens

- **Dashboard** — summary stat cards (products, customers, orders, low stock),
  recent orders table, and a low-stock alert panel.
- **Products** — table with name / SKU / price / stock / actions, add & edit
  modal form (validates price > 0, stock ≥ 0, unique SKU), delete with confirm.
- **Customers** — table with name / email / phone / actions, add form with
  email validation, delete with confirm.
- **Orders** — create-order builder (customer dropdown + product picker with
  per-line quantity and a live auto-calculated total), plus orders list table.
- **Order Details** — customer info, order summary, and the ordered-products
  breakdown with unit price, quantity and subtotal.

Includes a SaaS-style sidebar + top navbar, success/error toasts, empty states,
loading spinners, and a fully responsive layout (mobile drawer sidebar).

## Tech & design

- React 18 + Vite + React Router 6 (no extra UI libraries — hand-built
  components and CSS using the exact brand color system in `src/styles/index.css`).
- Inter typeface, rounded cards, soft shadows, the `#5F61F0` primary palette.

## Configuration

The backend URL is read from `VITE_API_URL` (see `.env`):

```
VITE_API_URL=http://localhost:8000
```

For deployment set it to your hosted backend URL (e.g. on Render/Vercel/Netlify).

## Run locally

```bash
cd Frontend
npm install
npm run dev          # http://localhost:3000
```

Make sure the backend is running at the URL in `.env`.

## Build for production

```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build
```

## Run with Docker

The root `docker-compose.yml` includes a `frontend` service that builds this
folder and serves the static build via nginx on port `3000`.

```bash
docker compose up --build
```

## Project structure

```
Frontend/
├── index.html
├── vite.config.js
├── .env / .env.example
├── Dockerfile / nginx.conf
└── src/
    ├── main.jsx              # entry, router + toast provider
    ├── App.jsx               # routes
    ├── api/client.js         # fetch wrapper + error parsing
    ├── context/ToastContext.jsx
    ├── styles/index.css      # brand color system + all styles
    ├── components/
    │   ├── Layout.jsx        # sidebar + topbar shell
    │   ├── Modal.jsx
    │   ├── ConfirmDialog.jsx
    │   ├── common.jsx        # Loading, EmptyState, Badge, money, formatDate
    │   └── icons.jsx         # inline SVG icon set
    └── pages/
        ├── Dashboard.jsx
        ├── Products.jsx
        ├── Customers.jsx
        ├── Orders.jsx
        └── OrderDetails.jsx
```
