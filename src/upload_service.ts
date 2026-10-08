import { z } from "zod";
import { infrai } from "./infrai_client.js";
import { decideUpload, type PaymentEvent } from "./risk_policy.js";

export const uploadRequest = z.object({
  paymentId: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  country: z.string().length(2),
  mediaBytes: z.number().int().positive()
});

export async function startMediaUpload(input: unknown, bucket: string) {
  const event = uploadRequest.parse(input) as PaymentEvent;
  const decision = decideUpload(event);
  if (decision === "review") return { decision, paymentId: event.paymentId };
  await infrai.storage.bucket.create({ name: bucket });
  const upload = await infrai.storage.multipart.create(bucket, event.paymentId);
  return { decision, paymentId: event.paymentId, upload };
}
