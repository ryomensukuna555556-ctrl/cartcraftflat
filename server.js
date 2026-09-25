// ============================================================================
// CartCraft — server.js
// Node.js + Express backend. Serves the static frontend and exposes a small
// JSON API backed by an in-memory "mock database" array (no real DB needed).
// ============================================================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
// Everything (index.html, style.css, api.js, cart.js, ui.js, main.js) lives
// flat in this same folder — no /public subfolder — so we serve the whole
// project root as static assets. (server.js / package.json are also
// technically reachable this way; fine for a portfolio demo, but swap to a
// dedicated "public" folder before this ever holds real secrets.)
app.use(express.static(__dirname));

// ---------------------------------------------------------------------------
// Mock "Database" — a plain in-memory array.
// Swap this out for a real DB (Postgres/Mongo/etc.) later without touching
// the route logic below.
// ---------------------------------------------------------------------------
const products = [
  {
    id: 1,
    name: 'Aether Wireless Headphones',
    category: 'Audio',
    price: 249.0,
    rating: 4.8,
    description: 'Studio-grade over-ear headphones with adaptive noise cancellation and 40-hour battery life.',
    image: 'https://picsum.photos/seed/cartcraft-audio1/600/600',
    badge: 'Best Seller'
  },
  {
    id: 2,
    name: 'Chronos Smart Watch',
    category: 'Wearables',
    price: 399.0,
    rating: 4.6,
    description: 'Titanium-cased smartwatch with always-on display, ECG sensor, and 10-day battery.',
    image: 'https://picsum.photos/seed/cartcraft-watch1/600/600',
    badge: 'New'
  },
  {
    id: 3,
    name: 'Voyager Leather Backpack',
    category: 'Bags',
    price: 189.0,
    rating: 4.9,
    description: 'Full-grain leather backpack with padded 16" laptop sleeve and weatherproof lining.',
    image: 'https://picsum.photos/seed/cartcraft-bag1/600/600',
    badge: null
  },
  {
    id: 4,
    name: 'Stride Runner Sneakers',
    category: 'Footwear',
    price: 139.0,
    rating: 4.5,
    description: 'Lightweight knit sneakers with responsive foam cushioning built for all-day comfort.',
    image: 'https://picsum.photos/seed/cartcraft-shoe1/600/600',
    badge: null
  },
  {
    id: 5,
    name: 'Horizon Polarized Sunglasses',
    category: 'Eyewear',
    price: 99.0,
    rating: 4.4,
    description: 'Hand-polished acetate frames with polarized, UV400-rated glass lenses.',
    image: 'https://picsum.photos/seed/cartcraft-sun1/600/600',
    badge: 'Limited'
  },
  {
    id: 6,
    name: 'Lumen Mirrorless Camera',
    category: 'Photography',
    price: 899.0,
    rating: 4.9,
    description: '24MP full-frame mirrorless camera with in-body stabilization and 4K/60 video.',
    image: 'https://picsum.photos/seed/cartcraft-cam1/600/600',
    badge: 'Best Seller'
  },
  {
    id: 7,
    name: 'Orbit Minimalist Desk Lamp',
    category: 'Home',
    price: 79.0,
    rating: 4.3,
    description: 'Dimmable LED desk lamp with wireless charging base and USB-C passthrough.',
    image: 'https://picsum.photos/seed/cartcraft-lamp1/600/600',
    badge: null
  },
  {
    id: 8,
    name: 'Cipher Mechanical Keyboard',
    category: 'Accessories',
    price: 159.0,
    rating: 4.7,
    description: 'Hot-swappable mechanical keyboard with hand-lubed switches and a CNC aluminum case.',
    image: 'https://picsum.photos/seed/cartcraft-kb1/600/600',
    badge: 'New'
  }
];

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// GET /api/products — list every product
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/products/:id — fetch a single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  res.json(product);
});

// POST /api/checkout — process a mock checkout.
// Body shape: { items: [{ id: number, qty: number }, ...] }
// The server re-derives prices from the mock DB (never trusts client totals),
// simulates a short processing delay, and returns an order confirmation.
app.post('/api/checkout', (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty.' });
  }

  let subtotal = 0;
  const orderItems = [];

  for (const line of items) {
    const product = products.find((p) => p.id === Number(line.id));
    if (!product) continue; // silently skip unknown ids
    const qty = Math.max(1, Number(line.qty) || 1);
    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    orderItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty,
      lineTotal: Number(lineTotal.toFixed(2))
    });
  }

  if (orderItems.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid items found in cart.' });
  }

  const shipping = subtotal > 200 ? 0 : 12.0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const order = {
    success: true,
    orderId: `CC-${Date.now().toString(36).toUpperCase()}`,
    placedAt: new Date().toISOString(),
    items: orderItems,
    subtotal: Number(subtotal.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    message: 'Order placed successfully. This is a mock checkout — no payment was processed.'
  };

  // Simulate realistic network/processing latency so the UI's loading
  // state has something to actually show.
  setTimeout(() => res.json(order), 700);
});

// ---------------------------------------------------------------------------
// Fallback — send index.html for any non-API route (simple SPA-style catch-all)
// ---------------------------------------------------------------------------
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  CartCraft is running → http://localhost:${PORT}\n`);
});
