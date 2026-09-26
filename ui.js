// ============================================================================
// ui.js — all DOM reading/writing lives here. Every function is a pure-ish
// "render this piece of state into the DOM" helper, or a small imperative
// open/close transition. main.js calls into this module; this module never
// calls back into cart.js or api.js directly (keeps the data flow one-way).
// ============================================================================

const money = (n) => `$${Number(n).toFixed(2)}`;

// ---------------------------------------------------------------------------
// Element references
// ---------------------------------------------------------------------------
const el = {
  productGrid: document.getElementById('product-grid'),
  productSkeleton: document.getElementById('product-skeleton'),
  productError: document.getElementById('product-error'),
  productCountLabel: document.getElementById('product-count-label'),
  productCardTemplate: document.getElementById('product-card-template'),
  shopHeading: document.getElementById('shop-heading'),

  collectionsDropdown: document.getElementById('collections-dropdown'),
  collectionsToggleBtn: document.getElementById('collections-toggle-btn'),
  collectionsMenu: document.getElementById('collections-menu'),
  collectionsChevron: document.getElementById('collections-chevron'),

  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  mobileMenu: document.getElementById('mobile-menu'),
  mobileMenuIconOpen: document.getElementById('mobile-menu-icon-open'),
  mobileMenuIconClose: document.getElementById('mobile-menu-icon-close'),

  productDetailOverlay: document.getElementById('product-detail-overlay'),
  pdBackBtn: document.getElementById('pd-back-btn'),
  pdCarouselTrack: document.getElementById('pd-carousel-track'),
  pdCarouselDots: document.getElementById('pd-carousel-dots'),
  pdCategory: document.getElementById('pd-category'),
  pdRating: document.getElementById('pd-rating'),
  pdName: document.getElementById('pd-name'),
  pdPrice: document.getElementById('pd-price'),
  pdDescription: document.getElementById('pd-description'),
  pdAddressInput: document.getElementById('pd-address-input'),
  pdShippingPrice: document.getElementById('pd-shipping-price'),
  pdShippingNote: document.getElementById('pd-shipping-note'),
  pdAddToCartBtn: document.getElementById('pd-add-to-cart-btn'),
  pdPlaceOrderBtn: document.getElementById('pd-place-order-btn'),

  cartToggleBtn: document.getElementById('cart-toggle-btn'),
  cartCloseBtn: document.getElementById('cart-close-btn'),
  cartOverlay: document.getElementById('cart-overlay'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartCount: document.getElementById('cart-count'),
  cartDrawerCount: document.getElementById('cart-drawer-count'),
  cartItemsContainer: document.getElementById('cart-items-container'),
  cartEmptyState: document.getElementById('cart-empty-state'),
  cartSummary: document.getElementById('cart-summary'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  cartItemTemplate: document.getElementById('cart-item-template'),
  checkoutBtn: document.getElementById('checkout-btn'),

  checkoutOverlay: document.getElementById('checkout-overlay'),
  checkoutModal: document.getElementById('checkout-modal'),
  checkoutCloseBtn: document.getElementById('checkout-close-btn'),
  checkoutSummaryView: document.getElementById('checkout-summary-view'),
  checkoutSuccessView: document.getElementById('checkout-success-view'),
  checkoutSummaryItems: document.getElementById('checkout-summary-items'),
  checkoutSubtotal: document.getElementById('checkout-subtotal'),
  checkoutShippingEstimate: document.getElementById('checkout-shipping-estimate'),
  checkoutTaxEstimate: document.getElementById('checkout-tax-estimate'),
  checkoutTotalEstimate: document.getElementById('checkout-total-estimate'),
  checkoutConfirmBtn: document.getElementById('checkout-confirm-btn'),
  checkoutConfirmLabel: document.getElementById('checkout-confirm-label'),
  checkoutOrderId: document.getElementById('checkout-order-id'),
  checkoutOrderTotal: document.getElementById('checkout-order-total'),
  checkoutSuccessMessage: document.getElementById('checkout-success-message'),
  checkoutDoneBtn: document.getElementById('checkout-done-btn'),

  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),

  storyOverlay: document.getElementById('story-overlay'),
  storyModal: document.getElementById('story-modal'),
  storyCloseBtn: document.getElementById('story-close-btn'),
  storyDoneBtn: document.getElementById('story-done-btn')
};

// ---------------------------------------------------------------------------
// Product grid
// ---------------------------------------------------------------------------

/** Render N skeleton cards while the product fetch is in flight. */
export function renderSkeleton(count = 8) {
  el.productSkeleton.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-shimmer aspect-square"></div>
      <div class="space-y-2 p-4">
        <div class="skeleton-shimmer h-3 w-16 rounded"></div>
        <div class="skeleton-shimmer h-4 w-3/4 rounded"></div>
        <div class="skeleton-shimmer h-3 w-full rounded"></div>
        <div class="skeleton-shimmer mt-3 h-8 w-full rounded-full"></div>
      </div>`;
    el.productSkeleton.appendChild(card);
  }
}

/**
 * Render the full product grid from an array of product objects.
 * @param {Array<Object>} products
 * @param {string} [headingText] — e.g. "Summer Collection". Defaults to "Shop all products".
 */
export function renderProducts(products, headingText = 'Shop all products') {
  el.shopHeading.textContent = headingText;
  el.productGrid.innerHTML = '';

  products.forEach((product) => {
    const node = el.productCardTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.productId = product.id;

    const img = node.querySelector('[data-role="image"]');
    img.src = product.image;
    img.alt = product.name;

    const badge = node.querySelector('[data-role="badge"]');
    if (product.badge) {
      badge.textContent = product.badge;
      badge.classList.remove('hidden');
    }

    node.querySelector('[data-role="category"]').textContent = product.category;
    node.querySelector('[data-role="name"]').textContent = product.name;
    node.querySelector('[data-role="description"]').textContent = product.description;
    node.querySelector('[data-role="price"]').textContent = money(product.price);

    // Both the hover "quick add" button and the visible "Add to cart" button
    // dispatch the same custom event; main.js listens once via delegation.
    node.querySelector('[data-role="add-btn"]').dataset.action = 'add-to-cart';
    node.querySelector('[data-role="quick-add"]').dataset.action = 'add-to-cart';

    el.productGrid.appendChild(node);
  });

  el.productSkeleton.classList.add('hidden');
  el.productGrid.classList.remove('hidden');
  el.productGrid.classList.add('grid');
  el.productCountLabel.textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;
}

export function renderProductError() {
  el.productSkeleton.classList.add('hidden');
  el.productError.classList.remove('hidden');
  el.productError.classList.add('flex');
  el.productCountLabel.textContent = 'Failed to load';
}

// ---------------------------------------------------------------------------
// Cart badge (header icon)
// ---------------------------------------------------------------------------

export function updateCartBadge(count) {
  el.cartCount.textContent = count;
  if (count > 0) {
    el.cartCount.classList.remove('opacity-0', 'scale-75');
  } else {
    el.cartCount.classList.add('opacity-0', 'scale-75');
  }
  el.cartDrawerCount.textContent = `(${count})`;
}

// ---------------------------------------------------------------------------
// Cart drawer
// ---------------------------------------------------------------------------

export function openCartDrawer() {
  el.cartOverlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    el.cartOverlay.classList.remove('opacity-0');
    el.cartDrawer.classList.remove('translate-x-full');
  });
  document.body.style.overflow = 'hidden';
}

export function closeCartDrawer() {
  el.cartOverlay.classList.add('opacity-0');
  el.cartDrawer.classList.add('translate-x-full');
  document.body.style.overflow = '';
  setTimeout(() => el.cartOverlay.classList.add('hidden'), 300);
}

/**
 * Re-render the cart drawer's item list + subtotal from the current cart state.
 * @param {{getItems: Function, getSubtotal: Function, isEmpty: Function}} cart
 */
export function renderCartDrawer(cart) {
  const items = cart.getItems();
  el.cartItemsContainer.innerHTML = '';

  if (cart.isEmpty()) {
    el.cartItemsContainer.classList.add('hidden');
    el.cartEmptyState.classList.remove('hidden');
    el.cartEmptyState.classList.add('flex');
    el.cartSummary.classList.add('hidden');
    el.checkoutBtn.disabled = true;
    return;
  }

  el.cartItemsContainer.classList.remove('hidden');
  el.cartEmptyState.classList.add('hidden');
  el.cartEmptyState.classList.remove('flex');
  el.cartSummary.classList.remove('hidden');
  el.checkoutBtn.disabled = false;

  items.forEach(({ product, qty }) => {
    const node = el.cartItemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.productId = product.id;

    const img = node.querySelector('[data-role="image"]');
    img.src = product.image;
    img.alt = product.name;

    node.querySelector('[data-role="name"]').textContent = product.name;
    node.querySelector('[data-role="qty"]').textContent = qty;
    node.querySelector('[data-role="line-total"]').textContent = money(product.price * qty);

    node.querySelector('[data-role="remove-btn"]').dataset.action = 'remove-item';
    node.querySelector('[data-role="decrease-btn"]').dataset.action = 'decrease-qty';
    node.querySelector('[data-role="increase-btn"]').dataset.action = 'increase-qty';

    el.cartItemsContainer.appendChild(node);
  });

  el.cartSubtotal.textContent = money(cart.getSubtotal());
}

// ---------------------------------------------------------------------------
// Checkout overlay
// ---------------------------------------------------------------------------

const SHIPPING_THRESHOLD = 200;
const FLAT_SHIPPING = 12;
const TAX_RATE = 0.08;

function estimateTotals(subtotal) {
  const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = subtotal * TAX_RATE;
  return { shipping, tax, total: subtotal + shipping + tax };
}

/** Populate and open the checkout summary (step 1) view. */
export function openCheckoutOverlay(cart) {
  el.checkoutSummaryView.classList.remove('hidden');
  el.checkoutSummaryView.classList.add('block');
  el.checkoutSuccessView.classList.add('hidden');
  el.checkoutSuccessView.classList.remove('flex');

  el.checkoutSummaryItems.innerHTML = '';
  cart.getItems().forEach(({ product, qty }) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-3 text-sm';
    row.innerHTML = `
      <span class="text-zinc-300">${qty} × ${product.name}</span>
      <span class="font-medium text-white">${money(product.price * qty)}</span>`;
    el.checkoutSummaryItems.appendChild(row);
  });

  const subtotal = cart.getSubtotal();
  const { shipping, tax, total } = estimateTotals(subtotal);

  el.checkoutSubtotal.textContent = money(subtotal);
  el.checkoutShippingEstimate.textContent = shipping === 0 ? 'Free' : money(shipping);
  el.checkoutTaxEstimate.textContent = money(tax);
  el.checkoutTotalEstimate.textContent = money(total);

  el.checkoutOverlay.classList.remove('hidden');
  el.checkoutOverlay.classList.add('flex');
  requestAnimationFrame(() => {
    el.checkoutOverlay.classList.remove('opacity-0');
    el.checkoutModal.classList.remove('scale-95');
  });
}

export function closeCheckoutOverlay() {
  el.checkoutOverlay.classList.add('opacity-0');
  el.checkoutModal.classList.add('scale-95');
  setTimeout(() => {
    el.checkoutOverlay.classList.add('hidden');
    el.checkoutOverlay.classList.remove('flex');
  }, 300);
}

export function setCheckoutLoading(isLoading) {
  el.checkoutConfirmBtn.disabled = isLoading;
  el.checkoutConfirmBtn.classList.toggle('opacity-60', isLoading);
  el.checkoutConfirmLabel.textContent = isLoading ? 'Placing order…' : 'Place order (mock)';
}

/** Swap the modal from the summary view to the success/confirmation view. */
export function showCheckoutSuccess(order) {
  el.checkoutSummaryView.classList.add('hidden');
  el.checkoutSummaryView.classList.remove('block');
  el.checkoutSuccessView.classList.remove('hidden');
  el.checkoutSuccessView.classList.add('flex');

  el.checkoutOrderId.textContent = order.orderId;
  el.checkoutOrderTotal.textContent = money(order.total);
  el.checkoutSuccessMessage.textContent = order.message || 'Your mock order has been placed.';
}

export function showCheckoutError(message) {
  showToast(message || 'Checkout failed. Please try again.', 'error');
}

// ---------------------------------------------------------------------------
// Story overlay ("Our story" / "Journal")
// ---------------------------------------------------------------------------

export function openStoryOverlay() {
  el.storyOverlay.classList.remove('hidden');
  el.storyOverlay.classList.add('flex');
  requestAnimationFrame(() => {
    el.storyOverlay.classList.remove('opacity-0');
    el.storyModal.classList.remove('scale-95');
  });
}

export function closeStoryOverlay() {
  el.storyOverlay.classList.add('opacity-0');
  el.storyModal.classList.add('scale-95');
  setTimeout(() => {
    el.storyOverlay.classList.add('hidden');
    el.storyOverlay.classList.remove('flex');
  }, 300);
}

// ---------------------------------------------------------------------------
// Collections dropdown (header nav)
// ---------------------------------------------------------------------------

export function openCollectionsMenu() {
  el.collectionsMenu.classList.remove('hidden');
  el.collectionsToggleBtn.setAttribute('aria-expanded', 'true');
  el.collectionsChevron.classList.add('rotate-180');
}

export function closeCollectionsMenu() {
  el.collectionsMenu.classList.add('hidden');
  el.collectionsToggleBtn.setAttribute('aria-expanded', 'false');
  el.collectionsChevron.classList.remove('rotate-180');
}

export function toggleCollectionsMenu() {
  if (el.collectionsMenu.classList.contains('hidden')) {
    openCollectionsMenu();
  } else {
    closeCollectionsMenu();
  }
}

/** Highlight whichever collection option matches the current filter, in
 *  BOTH the desktop dropdown and the mobile menu (they share a class). */
export function markActiveCollection(collectionId) {
  document.querySelectorAll('.collection-option').forEach((btn) => {
    const isActive = btn.dataset.collection === collectionId;
    btn.classList.toggle('bg-white/5', isActive);
    btn.classList.toggle('text-white', isActive);
  });
}

// ---------------------------------------------------------------------------
// Mobile menu (hamburger panel — replaces the desktop nav below the md breakpoint)
// ---------------------------------------------------------------------------

export function openMobileMenu() {
  el.mobileMenu.classList.remove('hidden');
  el.mobileMenuBtn.setAttribute('aria-expanded', 'true');
  el.mobileMenuIconOpen.classList.add('hidden');
  el.mobileMenuIconClose.classList.remove('hidden');
}

export function closeMobileMenu() {
  el.mobileMenu.classList.add('hidden');
  el.mobileMenuBtn.setAttribute('aria-expanded', 'false');
  el.mobileMenuIconOpen.classList.remove('hidden');
  el.mobileMenuIconClose.classList.add('hidden');
}

export function toggleMobileMenu() {
  if (el.mobileMenu.classList.contains('hidden')) {
    openMobileMenu();
  } else {
    closeMobileMenu();
  }
}

// ---------------------------------------------------------------------------
// Product Detail Screen
// ---------------------------------------------------------------------------

const DETAIL_IMAGE_COUNT = 4;

const COLLECTION_LABELS_UI = {
  fall: 'Fall',
  summer: 'Summer',
  winter: 'Winter'
};

const SHIPPING_TIER_COLOR = {
  empty: 'text-white',
  local: 'text-emerald-400',
  domestic: 'text-amber-300',
  international: 'text-rose-300'
};

/** Populate the detail screen for one product: carousel, copy, and a fresh
 *  (empty) address/shipping state. Does not open the overlay itself. */
export function renderProductDetail(product) {
  el.pdCategory.textContent = product.category;
  el.pdRating.textContent = product.rating ? `★ ${product.rating} rating` : '';
  el.pdName.textContent = product.name;
  el.pdPrice.textContent = money(product.price);

  // Detailed mock description — the real product copy plus a couple of
  // generated paragraphs, so the detail screen reads like a full PDP
  // without needing any new backend fields.
  el.pdDescription.innerHTML = '';
  const paragraphs = [
    product.description,
    `Part of our ${COLLECTION_LABELS_UI[product.collection] || 'core'} collection, finished by hand and inspected individually before it ships. Rated ${product.rating} / 5 by early customers.`,
    'Care: wipe clean with a soft, dry cloth. Avoid prolonged direct sunlight and moisture exposure.'
  ];
  paragraphs.forEach((text) => {
    const p = document.createElement('p');
    p.textContent = text;
    el.pdDescription.appendChild(p);
  });

  // Image carousel — 4 deterministic mock angles derived from the product's
  // own id, so the same "photos" show up every time without new backend data.
  el.pdCarouselTrack.innerHTML = '';
  el.pdCarouselDots.innerHTML = '';
  for (let i = 1; i <= DETAIL_IMAGE_COUNT; i++) {
    const img = document.createElement('img');
    img.src = `https://picsum.photos/seed/cartcraft-detail-${product.id}-${i}/800/800`;
    img.alt = `${product.name} — photo ${i} of ${DETAIL_IMAGE_COUNT}`;
    img.loading = 'lazy';
    img.className = 'aspect-square w-full flex-shrink-0 snap-center object-cover';
    el.pdCarouselTrack.appendChild(img);

    const dot = document.createElement('span');
    dot.className = `h-1.5 w-1.5 rounded-full transition-colors ${i === 1 ? 'bg-white' : 'bg-white/30'}`;
    el.pdCarouselDots.appendChild(dot);
  }
  el.pdCarouselTrack.scrollTo({ left: 0 });

  // Reset delivery address + shipping estimate for the new product.
  el.pdAddressInput.value = '';
  updateShippingDisplay({ tier: 'empty', amountLabel: 'Enter an address', note: '' });
}

/** Keep the carousel's dot indicator in sync as the user swipes/scrolls. */
el.pdCarouselTrack.addEventListener(
  'scroll',
  () => {
    const slideWidth = el.pdCarouselTrack.clientWidth || 1;
    const activeIndex = Math.round(el.pdCarouselTrack.scrollLeft / slideWidth);
    el.pdCarouselDots.querySelectorAll('span').forEach((dot, i) => {
      dot.classList.toggle('bg-white', i === activeIndex);
      dot.classList.toggle('bg-white/30', i !== activeIndex);
    });
  },
  { passive: true }
);

/** Update the mock, address-driven shipping estimate shown on the detail screen. */
export function updateShippingDisplay({ tier, amountLabel, note }) {
  el.pdShippingPrice.textContent = amountLabel;
  el.pdShippingNote.textContent = note;
  Object.values(SHIPPING_TIER_COLOR).forEach((cls) => el.pdShippingPrice.classList.remove(cls));
  el.pdShippingPrice.classList.add(SHIPPING_TIER_COLOR[tier] || 'text-white');
}

export function openProductDetailOverlay() {
  el.productDetailOverlay.classList.remove('hidden');
  el.productDetailOverlay.classList.add('flex');
  el.productDetailOverlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => el.productDetailOverlay.classList.remove('opacity-0'));
}

export function closeProductDetailOverlay() {
  el.productDetailOverlay.classList.add('opacity-0');
  document.body.style.overflow = '';
  setTimeout(() => {
    el.productDetailOverlay.classList.add('hidden');
    el.productDetailOverlay.classList.remove('flex');
  }, 300);
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

export function showToast(message, variant = 'success') {
  clearTimeout(toastTimer);
  el.toastMessage.textContent = message;

  const inner = el.toast.firstElementChild;
  inner.classList.toggle('bg-white', variant === 'success');
  inner.classList.toggle('text-ink-950', variant === 'success');
  inner.classList.toggle('bg-red-500', variant === 'error');
  inner.classList.toggle('text-white', variant === 'error');

  el.toast.classList.remove('opacity-0', 'translate-y-4');
  toastTimer = setTimeout(() => {
    el.toast.classList.add('opacity-0', 'translate-y-4');
  }, 2200);
}

export { el };
