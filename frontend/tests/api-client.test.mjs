import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { api } from '../src/api/client.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function controlledFetch() {
  const requests = [];
  globalThis.fetch = (url, options) => new Promise((resolve) => {
    requests.push({ url, options, resolve: (data, status = 200) => resolve(new Response(JSON.stringify(data), { status })) });
  });
  return requests;
}

test('simultaneous initial reads share a request, settled results are not cached', async () => {
  const requests = controlledFetch();
  const first = api.get('/folders', { deduplicate: true });
  const second = api.get('/folders', { deduplicate: true });
  assert.equal(requests.length, 1);
  requests[0].resolve({ folders: [] });
  assert.deepEqual(await first, await second);
  const refresh = api.get('/folders', { deduplicate: true });
  assert.equal(requests.length, 2);
  requests[1].resolve({ folders: ['new'] });
  assert.deepEqual(await refresh, { folders: ['new'] });
});

test('different filters and random requests remain independent', async () => {
  const requests = controlledFetch();
  const pending = [
    api.get('/photos?media_type=photos', { deduplicate: true }),
    api.get('/photos?media_type=videos', { deduplicate: true }),
    api.get('/photos?sort_by=random'), api.get('/photos?sort_by=random'),
  ];
  assert.equal(requests.length, 4);
  requests.forEach((request, index) => request.resolve(index));
  assert.deepEqual(await Promise.all(pending), [0, 1, 2, 3]);
});

test('failed reads can be retried', async () => {
  const requests = controlledFetch();
  const failed = api.get('/retry', { deduplicate: true });
  const rejected = assert.rejects(failed, /API Error 500/);
  requests[0].resolve({ error: true }, 500);
  await rejected;
  const retry = api.get('/retry', { deduplicate: true });
  assert.equal(requests.length, 2);
  requests[1].resolve({ ok: true });
  await retry;
});

test('mutations invalidate pending reads without deleting a newer request', async () => {
  const requests = controlledFetch();
  const old = api.get('/folders', { deduplicate: true });
  const mutation = api.post('/scan');
  requests[1].resolve({ ok: true });
  await mutation;
  const fresh = api.get('/folders', { deduplicate: true });
  requests[0].resolve({ stale: true });
  await old;
  const shared = api.get('/folders', { deduplicate: true });
  assert.equal(requests.length, 3);
  requests[2].resolve({ fresh: true });
  assert.deepEqual(await fresh, await shared);
});
