// ============================================================================
// main.js — application entry point. Fetches the catalog, renders it, and
// wires up every user interaction via event delegation. This is the only
// module that talks to cart.js, ui.js, AND api.js — everything else stays
// one-way (data modules <- main.js -> DOM modules).
// ============================================================================

import { fetchProducts, submitCheckout } from './api.js';
import { cart } from './cart.js';
import * as ui from './ui.js';

/** In-memory copy of the fetched catalog, keyed by id, for fast lookups
 *  (used for cart add/remove regardless of which collection is on screen). */
let catalog = new Map();

/** Full, unfiltered product list — the source of truth for collection filtering. */
let allProducts = [];

/** Which collection is currently shown in the grid. */
let currentCollection = 'all';

/** The product currently open in the Product Detail Screen, if any. */
let currentDetailProduct = null;

/**
 * Which "cart" the checkout overlay is currently confirming against.
 * Normally this is the real, persistent `cart`. When "Place order" is used
 * from the Product Detail Screen it's swapped for a throwaway single-item
 * pseudo-cart instead, so a direct order never touches the user's real bag.
 */
let checkoutSource = cart;

/**
 * Wraps one product as a minimal object matching the same interface the
 * checkout overlay and confirm handler already expect from the real cart
 * (getItems / getSubtotal / isEmpty / toCheckoutPayload) — lets "Place order"
 * reuse the exact same checkout screen without adding anything to the bag.
 */
function makeSingleItemCart(product, qty) {
  return {
    getItems: () => [{ product, qty }],
    getSubtotal: () => product.price * qty,
    isEmpty: () => qty <= 0,
    toCheckoutPayload: () => [{ id: product.id, qty }]
  };
}

// ---------------------------------------------------------------------------
// Dynamic shipping estimate — mock heuristic, base origin "Delhi, India".
// Nothing here calls any geocoding API; it just keyword-matches the address
// text the user types to decide how "far" the delivery is.
// ---------------------------------------------------------------------------

const NCR_KEYWORDS = [
  'delhi', 'new delhi', 'ncr', 'gurgaon', 'gurugram', 'noida', 'faridabad',
  'ghaziabad', 'dwarka', 'rohini', 'connaught place', 'saket', 'karol bagh'
];

const INDIA_KEYWORDS = [
  'india', 'mumbai', 'bombay', 'bangalore', 'bengaluru', 'pune', 'hyderabad',
  'chennai', 'kolkata', 'calcutta', 'ahmedabad', 'jaipur', 'lucknow',
  'chandigarh', 'surat', 'indore', 'nagpur', 'bhopal', 'patna', 'kochi',
  'cochin', 'goa', 'kerala', 'punjab', 'haryana', 'rajasthan', 'gujarat',
  'maharashtra', 'karnataka', 'tamil nadu', 'telangana', 'uttar pradesh',
  'bihar', 'west bengal'
];

const INDIA_PINCODE_REGEX = /\b\d{6}\b/;

/**
 * @param {string} rawAddress — whatever the user has typed so far
 * @returns {{tier: 'empty'|'local'|'domestic'|'international', amountLabel: string, note: string}}
 */
function computeShippingEstimate(rawAddress) {
  const address = rawAddress.trim().toLowerCase();

  if (!address) {
    return { tier: 'empty', amountLabel: 'Enter an address', note: '' };
  }

  if (NCR_KEYWORDS.some((kw) => address.includes(kw))) {
    return {
      tier: 'local',
      amountLabel: '$2.00',
      note: 'Local Delhi / NCR delivery — arrives in 1–2 days.'
    };
  }

  if (INDIA_KEYWORDS.some((kw) => address.includes(kw)) || INDIA_PINCODE_REGEX.test(address)) {
    return {
      tier: 'domestic',
      amountLabel: '$8.00',
      note: 'Delivery across India — arrives in 3–5 business days.'
    };
  }

  return {
    tier: 'international',
    amountLabel: '$35.00',
    note: 'International shipping from Delhi, India — arrives in 7–14 business days.'
  };
}

const COLLECTION_LABELS = {
  all: 'Shop all products',
  fall: 'Fall Collection',
  summer: 'Summer Collection',
  winter: 'Winter Collection'
};

/**
 * Filter the in-memory product list by collection and re-render the grid.
 * The cart is untouched by this — items already added stay in the bag no
 * matter which collection you switch to next.
 */
function applyCollectionFilter(collectionId) {
  currentCollection = collectionId;

  const filtered =
    collectionId === 'all' ? allProducts : allProducts.filter((p) => p.collection === collectionId);

  ui.renderProducts(filtered, COLLECTION_LABELS[collectionId] || 'Shop all products');
  ui.markActiveCollection(collectionId);
  ui.el.shopHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function init() {
  ui.renderSkeleton(8);

  try {
    const products = await fetchProducts();
    allProducts = products;
    catalog = new Map(products.map((p) => [p.id, p]));
    ui.renderProducts(products);
    ui.markActiveCollection('all');
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
    checkoutSource = cart;
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

  ui.el.collectionsToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.toggleCollectionsMenu();
  });

  ui.el.mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ui.toggleMobileMenu();
  });

  // ---- Product Detail Screen ----
  ui.el.pdBackBtn.addEventListener('click', () => ui.closeProductDetailOverlay());

  let shippingDebounceTimer = null;
  ui.el.pdAddressInput.addEventListener('input', () => {
    clearTimeout(shippingDebounceTimer);
    shippingDebounceTimer = setTimeout(() => {
      ui.updateShippingDisplay(computeShippingEstimate(ui.el.pdAddressInput.value));
    }, 200);
  });

  ui.el.pdAddToCartBtn.addEventListener('click', () => {
    if (!currentDetailProduct) return;
    cart.addItem(currentDetailProduct, 1);
    ui.showToast(`Added "${currentDetailProduct.name}" to your bag`);
    ui.closeProductDetailOverlay();
  });

  ui.el.pdPlaceOrderBtn.addEventListener('click', () => {
    if (!currentDetailProduct) return;
    // Dual-path checkout: this skips the cart entirely and goes straight to
    // the checkout screen for just this one product.
    checkoutSource = makeSingleItemCart(currentDetailProduct, 1);
    ui.closeProductDetailOverlay();
    setTimeout(() => ui.openCheckoutOverlay(checkoutSource), 320);
  });

  // Clicking anywhere outside the dropdown closes it.
  document.addEventListener('click', (e) => {
    if (!ui.el.collectionsDropdown.contains(e.target)) {
      ui.closeCollectionsMenu();
    }
  });

  // Escape key closes whichever overlay is open.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    ui.closeCartDrawer();
    ui.closeCheckoutOverlay();
    ui.closeStoryOverlay();
    ui.closeCollectionsMenu();
    ui.closeMobileMenu();
    ui.closeProductDetailOverlay();
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
      ui.closeMobileMenu();
      return;
    }

    if (action === 'select-collection') {
      applyCollectionFilter(actionEl.dataset.collection);
      ui.closeCollectionsMenu();
      ui.closeMobileMenu();
      return;
    }

    if (action === 'close-mobile-menu') {
      ui.closeMobileMenu();
      return;
    }

    if (action === 'view-product') {
      const card = actionEl.closest('[data-product-id]');
      const productId = Number(card.dataset.productId);
      const product = catalog.get(productId);
      if (!product) return;

      currentDetailProduct = product;
      ui.renderProductDetail(product);
      ui.openProductDetailOverlay();
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
  if (checkoutSource.isEmpty()) return;

  ui.setCheckoutLoading(true);
  try {
    const order = await submitCheckout(checkoutSource.toCheckoutPayload());
    ui.showCheckoutSuccess(order);
    ui.showToast('Order placed — thank you!');
    // Only clear the real, persistent cart if that's what we actually
    // checked out. A direct "Place order" uses a throwaway single-item
    // pseudo-cart, so the user's real bag is left exactly as it was.
    if (checkoutSource === cart) {
      cart.clear();
    }
  } catch (err) {
    console.error(err);
    ui.showCheckoutError(err.message);
  } finally {
    ui.setCheckoutLoading(false);
  }
}

// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', init);
