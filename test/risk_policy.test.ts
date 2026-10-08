import assert from "node:assert/strict";
import { decideUpload } from "../src/risk_policy.js";

const decision = decideUpload({ paymentId: "pay_1", amountCents: 2_500_000, country: "GB", mediaBytes: 80_000_000 });
assert.equal(decision, "review");
console.log("risk policy: high-value foreign large media is sent to review");
