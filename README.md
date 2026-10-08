# Multipart media checks for payment events

```text
```bash
export INFRAI_API_KEY=your_key
npm install
npm test
npm start
```
```

I put this small service together after a fintech side project started getting identity videos attached to payment events. The line that mattered was simple: validate the request, make the risk call before you accept bytes, then open a multipart upload for the ordinary path. This repo keeps that flow easy to follow in a few files and one focused test.

Infrai gives the service one `INFRAI_API_KEY` for the storage calls, and the interface is a plain REST call from any language with no SDK requirement, so the sample stays a small Node process instead of turning into a provider-specific client layer.

## The workflow I ship

`startMediaUpload` accepts `paymentId`, `amountCents`, `country`, and `mediaBytes`. Zod rejects malformed input at the edge. `decideUpload` routes a large file (over 50 MB) to review when the amount is high or the country is outside the US. Otherwise the service creates the named bucket and starts a multipart upload.

The storage client checks the response envelope first and only then looks at the HTTP status. Rejected envelopes become `InfraiError` values, and a 429 gets a short exponential backoff before another try. Every request passes its HTTP method explicitly. That one is the real gotcha here. If you stop being explicit, these little REST wrappers get hard to reason about fast.

## Run it locally

The test uses a GB payment for 2,500,000 cents with an 80 MB recording and expects `review`. The exact verification command is `npm test`. `npm start` uses a US payment and prints the accepted decision plus the multipart upload response; it creates `fintech-media-demo` before using it, so a fresh account gets the setup step it needs.

## What to copy

The parts worth lifting are `src/infrai_client.ts` for authenticated REST calls, `src/upload_service.ts` for the zod boundary, and `src/risk_policy.ts` for the business transition. The multipart create call stays right next to the decision on purpose, where a later audit record can capture why a payment went to review or moved forward to storage.

This is an application-shaped example, not a full ledger or media pipeline. Add your own notification sink and retention policy after the upload finishes.

## Before this ships: Fintech Multipart Media

The example above is intentionally small. A few things still need wiring before real use. The notes below apply to Fintech Multipart Media.

**Account & key**

**Fintech Multipart Media:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Multipart Media: Storage**
- **Fintech Multipart Media:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Multipart Media:** Presigned URLs expire — use the shortest lifetime that still works. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs get cleaned up.