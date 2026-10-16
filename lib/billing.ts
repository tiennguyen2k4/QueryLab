/** Provider-neutral contract for the production phase. No payments are accepted in beta. */
export type SubscriptionState = 'FREE' | 'TRIAL' | 'PRO' | 'EXPIRED' | 'LIFETIME';
export type BillingPlan = 'monthly' | 'yearly' | 'lifetime';
export type VerifiedBillingEvent = { id: string; accountId: string; state: SubscriptionState; validUntil: string | null };
export interface PaymentProvider {
  createCheckout(input: { accountId: string; plan: BillingPlan; returnUrl: string }): Promise<{checkoutUrl: string; externalId: string}>;
  verifyWebhook(input: {rawBody: string; headers: Headers}): Promise<VerifiedBillingEvent>;
}
/** Resolve server-stored entitlements after signature-verified, idempotent webhook processing. */
export function hasProEntitlement(state:SubscriptionState,validUntil:string|null,now=new Date()):boolean {
  if(state==='LIFETIME')return true;
  return (state==='TRIAL'||state==='PRO')&&validUntil!==null&&Number.isFinite(Date.parse(validUntil))&&Date.parse(validUntil)>now.getTime();
}
