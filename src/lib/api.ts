// Lightweight API client for the ITR Filing backend.
// Token is held in memory only (set by AuthContext). 401 -> auth listener clears + redirects.

export const API_BASE = "http://192.168.1.106:8000/api/v1";

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}
export function getAuthToken() {
  return _token;
}
export function setOnUnauthorized(fn: () => void) {
  _onUnauthorized = fn;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Opts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  query?: Record<string, any>;
  raw?: boolean; // skip JSON parse
  headers?: Record<string, string>;
  auth?: boolean; // default true
};

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const { method = "GET", body, query, raw, headers = {}, auth = true } = opts;
  let url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const s = qs.toString();
    if (s) url += (url.includes("?") ? "&" : "?") + s;
  }
  const h: Record<string, string> = { ...headers };
  if (body && !(body instanceof FormData) && !h["Content-Type"]) {
    h["Content-Type"] = "application/json";
  }
  if (auth && _token) h["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(url, {
    method,
    headers: h,
    body: body
      ? body instanceof FormData
        ? body
        : typeof body === "string"
          ? body
          : JSON.stringify(body)
      : undefined,
  });

  if (res.status === 401 && auth) {
    _onUnauthorized?.();
  }

  if (!res.ok) {
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      try {
        data = await res.text();
      } catch {}
    }
    const msg =
      (data && (data.detail?.message || data.detail || data.message)) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, typeof msg === "string" ? msg : JSON.stringify(msg), data);
  }

  if (raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

// Two-step presigned upload helper
export async function presignedUpload(opts: {
  presignUrl: string;
  presignBody: any;
  file: File;
  confirmUrl: string;
  confirmQuery: (presign: any) => Record<string, any>;
  onProgress?: (pct: number) => void;
}) {
  const presign = await api<any>(opts.presignUrl, { method: "POST", body: opts.presignBody });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presign.upload_url);
    if (opts.file.type) xhr.setRequestHeader("Content-Type", opts.file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(opts.file);
  });

  const q = opts.confirmQuery(presign);
  await api(opts.confirmUrl, { method: "POST", query: q });
  return presign;
}
