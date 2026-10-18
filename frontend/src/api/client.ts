const BASE_URL = '/api';
const pendingGets = new Map<string, Promise<unknown>>();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }
  return res.json();
}

function get<T>(path: string, options?: { deduplicate?: boolean }): Promise<T> {
  if (!options?.deduplicate) return request<T>(path);
  const pending = pendingGets.get(path);
  if (pending) return pending as Promise<T>;

  const promise = request<T>(path).finally(() => {
    // A mutation can invalidate this entry while its request is still running.
    if (pendingGets.get(path) === promise) pendingGets.delete(path);
  });
  pendingGets.set(path, promise);
  return promise;
}

async function mutate<T>(path: string, options: RequestInit): Promise<T> {
  pendingGets.clear();
  try {
    return await request<T>(path, options);
  } finally {
    pendingGets.clear();
  }
}

export const api = {
  get,
  post: <T>(path: string, body?: unknown) =>
    mutate<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    mutate<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => mutate<T>(path, { method: 'DELETE' }),
};
