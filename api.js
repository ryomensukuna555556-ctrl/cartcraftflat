// ============================================================================
// api.js — thin wrapper around fetch() for talking to the Express backend.
// Keeping this isolated means main.js never touches raw fetch/URL strings.
// ============================================================================

const BASE_URL = ''; // same-origin; change if the API is ever served elsewhere

/**
 * Fetch the full product catalog from the mock backend.
 * @returns {Promise<Array<Object>>}
 */
export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/api/products`);
  if (!res.ok) {
    throw new Error(`Failed to load products (status ${res.status})`);
  }
  return res.json();
}

/**
 * Submit the current cart to the mock checkout endpoint.
 * @param {Array<{id:number, qty:number}>} items
 * @param {number} [shippingOverride] — an address-based shipping amount to use
 *   instead of the server's default flat-rate rule (see computeShippingEstimate
 *   in main.js). Omit to let the server fall back to its own default.
 * @returns {Promise<Object>} order confirmation payload
 */
export async function submitCheckout(items, shippingOverride) {
  const body = { items };
  if (typeof shippingOverride === 'number') {
    body.shipping = shippingOverride;
  }

  const res = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.message || `Checkout failed (status ${res.status})`);
  }

  return data;
}
