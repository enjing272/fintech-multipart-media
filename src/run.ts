import { startMediaUpload } from "./upload_service.js";

const input = {
  paymentId: "pay_demo_1001",
  amountCents: 12500,
  country: "US",
  mediaBytes: 72_000_000
};

const result = await startMediaUpload(input, "fintech-media-demo");
console.log(JSON.stringify(result, null, 2));
