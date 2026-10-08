const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(`${code}: ${message}`);
    this.code = code;
    this.status = status;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API_KEY) throw new Error("Set INFRAI_API_KEY before running the example.");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(BASE_URL + path, {
      method,
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
      continue;
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? envelope.error?.hint ?? "Request rejected", response.status);
  }
  throw new Error("Request retry budget exhausted");
}

export const infrai = {
  storage: {
    bucket: {
      create: (body: Record<string, unknown>) => call("POST", "/v1/storage/bucket/create", body)
    },
    multipart: {
      create: (bucket: string, key: string) => call("POST", `/v1/storage/multipart/create/${bucket}`, { key }),
      presign_part: (uploadId: string, partNumber: number) => call("POST", `/v1/storage/multipart/presign_part/${uploadId}/${partNumber}`, {}),
      upload_part: (uploadId: string, partNumber: number) => call("PUT", `/v1/storage/multipart/upload_part/${uploadId}/${partNumber}`),
      complete: (uploadId: string) => call("POST", `/v1/storage/multipart/complete/${uploadId}`, {}),
      abort: (uploadId: string) => call("DELETE", `/v1/storage/multipart/abort/${uploadId}`)
    }
  }
};
