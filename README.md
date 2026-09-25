# CartCraft

A premium, production-styled e-commerce portfolio demo built with a **vanilla full-stack architecture**: plain HTML5, Tailwind CSS (CDN), modular ES6+ JavaScript on the frontend, and Node.js + Express with an in-memory mock database on the backend.

## Run it

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

Use `npm run dev` instead of `npm start` to auto-restart the server on file changes (uses Node's built-in `--watch`, no extra dependency).

## What's inside

- **Dynamic product grid** — fetched from `GET /api/products`, rendered from an HTML `<template>`, with a skeleton-loading state and an error state if the server is down.
- **Sliding cart drawer** — add/remove items, adjust quantity, live subtotal, badge count in the header. Cart state persists to `localStorage` so a page refresh doesn't lose it.
- **Checkout summary overlay** — review items + estimated shipping/tax/total, confirm, and POST to `POST /api/checkout`. The server re-derives prices from its own mock DB (never trusts client-sent totals), simulates network latency, and returns a mock order confirmation (order ID + total) shown in a success state inside the same modal, plus a toast notification.

## Project structure

See the file tree in the accompanying chat message for the full annotated layout.

## Next steps if you extend this

- Swap the `products` array in `server.js` for a real database — the route handlers are already written to not care where the data comes from.
- Add auth, real payments (Stripe), and persistent orders once you're ready to move past the mock layer.
