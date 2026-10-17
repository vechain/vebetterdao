// @stripe/crypto (a dependency of @privy-io/react-auth 3.x) imports this uninstalled peer for
// Privy's Stripe onramp, which we never open. Aliased in next.config.ts.
export function loadStripe() {
  return Promise.reject(new Error("@stripe/stripe-js is not installed"))
}
