// ============================================================================
// cart.js — client-side cart state.
// A tiny observable store: mutate through the methods below, subscribe to be
// notified on every change so the UI can re-render. Persists to
// localStorage so a refresh doesn't wipe the bag.
// ============================================================================

const STORAGE_KEY = 'cartcraft:cart';

class Cart {
  constructor() {
    /** @type {Map<number, {product: Object, qty: number}>} */
    this.items = new Map();
    this._listeners = new Set();
    this._restore();
  }

  /** Register a callback invoked after every cart mutation. */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._persist();
    this._listeners.forEach((fn) => fn(this));
  }

  _persist() {
    try {
      const serializable = Array.from(this.items.values()).map(({ product, qty }) => ({
        product,
        qty
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (err) {
      // localStorage can fail in private browsing / storage-full scenarios —
      // the cart still works in-memory, it just won't survive a refresh.
      console.warn('CartCraft: could not persist cart to localStorage.', err);
    }
  }

  _restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      parsed.forEach(({ product, qty }) => {
        if (product && typeof product.id === 'number') {
          this.items.set(product.id, { product, qty });
        }
      });
    } catch (err) {
      console.warn('CartCraft: could not restore cart from localStorage.', err);
    }
  }

  /** Add a product to the cart, or bump its quantity if already present. */
  addItem(product, qty = 1) {
    const existing = this.items.get(product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.set(product.id, { product, qty });
    }
    this._emit();
  }

  /** Remove a line item entirely, regardless of quantity. */
  removeItem(productId) {
    this.items.delete(productId);
    this._emit();
  }

  /** Set an explicit quantity; removes the line if it drops to 0 or below. */
  setQty(productId, qty) {
    const entry = this.items.get(productId);
    if (!entry) return;
    if (qty <= 0) {
      this.items.delete(productId);
    } else {
      entry.qty = qty;
    }
    this._emit();
  }

  increment(productId) {
    const entry = this.items.get(productId);
    if (!entry) return;
    entry.qty += 1;
    this._emit();
  }

  decrement(productId) {
    const entry = this.items.get(productId);
    if (!entry) return;
    if (entry.qty <= 1) {
      this.items.delete(productId);
    } else {
      entry.qty -= 1;
    }
    this._emit();
  }

  clear() {
    this.items.clear();
    this._emit();
  }

  /** Total number of units in the cart (sum of quantities). */
  getCount() {
    let count = 0;
    this.items.forEach(({ qty }) => (count += qty));
    return count;
  }

  /** Subtotal across all line items. */
  getSubtotal() {
    let subtotal = 0;
    this.items.forEach(({ product, qty }) => (subtotal += product.price * qty));
    return subtotal;
  }

  /** Ordered array of { product, qty } line items. */
  getItems() {
    return Array.from(this.items.values());
  }

  isEmpty() {
    return this.items.size === 0;
  }

  /** Shape expected by the backend's /api/checkout endpoint. */
  toCheckoutPayload() {
    return this.getItems().map(({ product, qty }) => ({ id: product.id, qty }));
  }
}

// A single shared cart instance for the whole app.
export const cart = new Cart();
