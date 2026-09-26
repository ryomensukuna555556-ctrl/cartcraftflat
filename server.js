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
  // ---- Fall Collection (original catalog) ----
  {
    id: 1,
    name: 'Aether Wireless Headphones',
    category: 'Audio',
    collection: 'fall',
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
    collection: 'fall',
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
    collection: 'fall',
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
    collection: 'fall',
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
    collection: 'fall',
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
    collection: 'fall',
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
    collection: 'fall',
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
    collection: 'fall',
    price: 159.0,
    rating: 4.7,
    description: 'Hot-swappable mechanical keyboard with hand-lubed switches and a CNC aluminum case.',
    image: 'https://picsum.photos/seed/cartcraft-kb1/600/600',
    badge: 'New'
  },

  // ---- Summer Collection ----
  {
    id: 9,
    name: 'Solstice Linen Shirt',
    category: 'Apparel',
    collection: 'summer',
    price: 69.0,
    rating: 4.5,
    description: 'Breathable 100% linen shirt, garment-washed for a relaxed drape in high heat.',
    image: 'https://picsum.photos/seed/cartcraft-summer1/600/600',
    badge: 'New'
  },
  {
    id: 10,
    name: 'Tide Swim Shorts',
    category: 'Apparel',
    collection: 'summer',
    price: 45.0,
    rating: 4.4,
    description: 'Quick-dry swim shorts with a recycled-nylon shell and a secure zip pocket.',
    image: 'https://picsum.photos/seed/cartcraft-summer2/600/600',
    badge: null
  },
  {
    id: 11,
    name: 'Breeze Straw Hat',
    category: 'Accessories',
    collection: 'summer',
    price: 39.0,
    rating: 4.6,
    description: 'Hand-woven wide-brim straw hat with UPF 50+ sun protection.',
    image: 'https://picsum.photos/seed/cartcraft-summer3/600/600',
    badge: null
  },
  {
    id: 12,
    name: 'Coral Reef Snorkel Set',
    category: 'Outdoors',
    collection: 'summer',
    price: 59.0,
    rating: 4.3,
    description: 'Anti-fog mask and dry-top snorkel set with a compact mesh travel bag.',
    image: 'https://picsum.photos/seed/cartcraft-summer4/600/600',
    badge: 'Limited'
  },
  {
    id: 13,
    name: 'Citrus Cooler Bottle',
    category: 'Home',
    collection: 'summer',
    price: 29.0,
    rating: 4.7,
    description: 'Double-wall insulated bottle that keeps drinks cold for 24 hours.',
    image: 'https://picsum.photos/seed/cartcraft-summer5/600/600',
    badge: 'Best Seller'
  },

  // ---- Winter Collection ----
  {
    id: 14,
    name: 'Drift Wool Sweater',
    category: 'Apparel',
    collection: 'winter',
    price: 129.0,
    rating: 4.8,
    description: 'Heavyweight merino-blend sweater, hand-finished with a ribbed shawl collar.',
    image: 'https://picsum.photos/seed/cartcraft-winter1/600/600',
    badge: 'Best Seller'
  },
  {
    id: 15,
    name: 'Frost Puffer Jacket',
    category: 'Apparel',
    collection: 'winter',
    price: 219.0,
    rating: 4.9,
    description: 'Recycled-down puffer rated to -15°C, with sealed seams and a packable hood.',
    image: 'https://picsum.photos/seed/cartcraft-winter2/600/600',
    badge: 'New'
  },
  {
    id: 16,
    name: 'Alpine Knit Beanie',
    category: 'Accessories',
    collection: 'winter',
    price: 35.0,
    rating: 4.5,
    description: 'Double-layer ribbed beanie in brushed wool for all-day warmth.',
    image: 'https://picsum.photos/seed/cartcraft-winter3/600/600',
    badge: null
  },
  {
    id: 17,
    name: 'Ember Thermal Mug',
    category: 'Home',
    collection: 'winter',
    price: 32.0,
    rating: 4.6,
    description: 'Vacuum-insulated travel mug that holds heat for up to 8 hours.',
    image: 'https://picsum.photos/seed/cartcraft-winter4/600/600',
    badge: null
  },
  {
    id: 18,
    name: 'Glacier Wool Gloves',
    category: 'Accessories',
    collection: 'winter',
    price: 42.0,
    rating: 4.4,
    description: 'Touchscreen-friendly wool gloves lined with brushed fleece.',
    image: 'https://picsum.photos/seed/cartcraft-winter5/600/600',
    badge: 'Limited'
  }
];

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// GET /api/products — list every product, or filter with ?collection=summer
app.get('/api/products', (req, res) => {
  const { collection } = req.query;
  if (!collection || collection === 'all') {
    return res.json(products);
  }
  res.json(products.filter((p) => p.collection === collection));
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
  const { items, shipping: shippingOverride } = req.body;

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

  // If the client already showed the customer an address-based shipping
  // estimate (see computeShippingEstimate in main.js), honor that exact
  // number here so the final confirmed total matches what they agreed to.
  // Otherwise fall back to the original flat-rate placeholder rule.
  const shipping =
    typeof shippingOverride === 'number' && shippingOverride >= 0 ? shippingOverride : subtotal > 200 ? 0 : 12.0;
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
