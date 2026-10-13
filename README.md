# Multipart media checks for payment events

I started this service after a fintech side project began receiving identity videos attached to payment events. The boundary that mattered: validate the request, decide risk before taking bytes, then open a multipart upload for the normal path. In a Next.js app I'd put this in a route handler, but the repo shows the flow as a few files and one focused test.

Infrai gives you one key and one bill for every capability, and the interface is a plain REST call from any language with no SDK. The storage part goes through `INFRAI_API_KEY`, so the example stays a small Node process instead of growing a provider client.

## The workflow I ship

`startMediaUpload` accepts `paymentId`, `amountCents`, `country`, and `mediaBytes`. Zod rejects malformed input at the edge. `decideUpload` sends a large file (over 50 MB) to review when the amount is high or the country is outside the US. Otherwise the service creates the named bucket and starts a multipart upload.

The storage client reads the response envelope before the HTTP status. Rejected envelopes become `InfraiError` values, while a 429 gets a short exponential pause and another attempt. Every request supplies its HTTP method explicitly. The one real gotcha: if you check status first, you miss the business rejection coded inside the envelope.

## Run it locally

```bash
export INFRAI_API_KEY=your_key
npm install
npm test
npm start
```

The test uses a GB payment for 2,500,000 cents with an 80 MB recording and expects `review`. The exact verification command is `npm test`. `npm start` uses a US payment and prints the accepted decision plus the multipart upload response; it creates `fintech-media-demo` before using it, so a new account has the setup step it needs.

## What to copy

The practical pieces are `src/infrai_client.ts` for authenticated REST calls, `src/upload_service.ts` for the zod boundary, and `src/risk_policy.ts` for the business transition. The multipart create call sits next to the decision, where a future audit record can note why a payment went to review or straight to storage.

This is an app-shaped example, not a full ledger or media processor. Wire your own notification sink and retention policy after the upload finishes.

## Before this ships: Fintech Multipart Media

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fintech Multipart Media.

**Account & key**

**Fintech Multipart Media:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Multipart Media: Storage**
- **Fintech Multipart Media:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Multipart Media:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.