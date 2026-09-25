// ============================================================================
// main.js — application entry point. Fetches the catalog, renders it, and
// wires up every user interaction via event delegation. This is the only
// module that talks to cart.js, ui.js, AND api.js — everything else stays
// one-way (data modules <- main.js -> DOM modules).
// ============================================================================

import { fetchProducts, submitCheckout } from './api.js';
import { cart } from './cart.js';
import * as ui from './ui.js';

/** In-memory copy of the fetched catalog, keyed by id, for fast lookups. */
let catalog = new Map();

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function init() {
  ui.renderSkeleton(8);

  try {
    const products = await fetchProducts();
    catalog = new Map(products.map((p) => [p.id, p]));
    ui.renderProducts(products);
  } catch (err) {
    console.error(err);
    ui.renderProductError();
  }

  // Reflect whatever was restored from localStorage on first paint.
  ui.renderCartDrawer(cart);
  ui.updateCartBadge(cart.getCount());

  // Re-render the drawer + badge automatically on every cart mutation.
  cart.subscribe((c) => {
    ui.renderCartDrawer(c);
    ui.updateCartBadge(c.getCount());
  });

  bindStaticControls();
  bindDelegatedClicks();
}

// ---------------------------------------------------------------------------
// Static controls (elements that exist once, up-front, in the HTML)
// ---------------------------------------------------------------------------

function bindStaticControls() {
  ui.el.cartToggleBtn.addEventListener('click', () => ui.openCartDrawer());
  ui.el.cartCloseBtn.addEventListener('click', () => ui.closeCartDrawer());
  ui.el.cartOverlay.addEventListener('click', () => ui.closeCartDrawer());

  ui.el.checkoutBtn.addEventListener('click', () => {
    if (cart.isEmpty()) return;
    ui.closeCartDrawer();
    ui.openCheckoutOverlay(cart);
  });

  ui.el.checkoutCloseBtn.addEventListener('click', () => ui.closeCheckoutOverlay());
  ui.el.checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === ui.el.checkoutOverlay) ui.closeCheckoutOverlay();
  });

  ui.el.checkoutConfirmBtn.addEventListener('click', handleCheckoutConfirm);

  ui.el.checkoutDoneBtn.addEventListener('click', () => {
    ui.closeCheckoutOverlay();
  });

  ui.el.storyCloseBtn.addEventListener('click', () => ui.closeStoryOverlay());
  ui.el.storyDoneBtn.addEventListener('click', () => ui.closeStoryOverlay());
  ui.el.storyOverlay.addEventListener('click', (e) => {
    if (e.target === ui.el.storyOverlay) ui.closeStoryOverlay();
  });

  // Escape key closes whichever overlay is open.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    ui.closeCartDrawer();
    ui.closeCheckoutOverlay();
    ui.closeStoryOverlay();
  });
}

// ---------------------------------------------------------------------------
// Delegated clicks — covers elements that are cloned from <template> at
// render time (product cards, cart line items), so we never need to
// re-bind listeners after every re-render.
// ---------------------------------------------------------------------------

function bindDelegatedClicks() {
  document.body.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    if (action === 'open-story') {
      e.preventDefault();
      ui.openStoryOverlay();
      return;
    }

    if (action === 'add-to-cart') {
      const card = actionEl.closest('[data-product-id]');
      const productId = Number(card.dataset.productId);
      const product = catalog.get(productId);
      if (!product) return;

      cart.addItem(product, 1);
      ui.showToast(`Added "${product.name}" to your bag`);
      return;
    }

    if (action === 'remove-item') {
      const row = actionEl.closest('[data-product-id]');
      cart.removeItem(Number(row.dataset.productId));
      return;
    }

    if (action === 'increase-qty') {
      const row = actionEl.closest('[data-product-id]');
      cart.increment(Number(row.dataset.productId));
      return;
    }

    if (action === 'decrease-qty') {
      const row = actionEl.closest('[data-product-id]');
      cart.decrement(Number(row.dataset.productId));
      return;
    }
  });
}

// ---------------------------------------------------------------------------
// Checkout flow
// ---------------------------------------------------------------------------

async function handleCheckoutConfirm() {
  if (cart.isEmpty()) return;

  ui.setCheckoutLoading(true);
  try {
    const order = await submitCheckout(cart.toCheckoutPayload());
    ui.showCheckoutSuccess(order);
    ui.showToast('Order placed — thank you!');
    cart.clear();
  } catch (err) {
    console.error(err);
    ui.showCheckoutError(err.message);
  } finally {
    ui.setCheckoutLoading(false);
  }
}

// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', init);
