export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type FetchOptions = RequestInit & { json?: unknown };

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = options.headers ? { ...options.headers } : {};

  let body = options.body;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  return fetch(url, {
    ...options,
    headers,
    body,
    credentials: "include"
  });
}
