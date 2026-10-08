export type PaymentEvent = { paymentId: string; amountCents: number; country: string; mediaBytes: number };
export type Decision = "accept" | "review";

export function decideUpload(event: PaymentEvent): Decision {
  const largeMedia = event.mediaBytes > 50_000_000;
  const unusualAmount = event.amountCents >= 1_000_000;
  const unfamiliarCountry = event.country !== "US";
  return largeMedia && (unusualAmount || unfamiliarCountry) ? "review" : "accept";
}
