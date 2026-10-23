import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { useAppStore } = await import('../src/stores/appStore.ts');

beforeEach(() => {
  useAppStore.setState({ isDeleteMode: false, selectedPhotoIds: [], selectedPhotos: [] });
});

const makePhotos = (count) => Array.from({ length: count }, (_, index) => ({ id: index + 1, file_name: `${index + 1}.jpg` }));

test('normal mode keeps the four-photo comparison limit', () => {
  const photos = makePhotos(6);
  photos.forEach((photo) => useAppStore.getState().togglePhotoSelection(photo));
  assert.deepEqual(useAppStore.getState().selectedPhotoIds, [1, 2, 3, 4]);
  useAppStore.getState().togglePhotoSelection(photos[1]);
  useAppStore.getState().togglePhotoSelection(photos[5]);
  assert.deepEqual(useAppStore.getState().selectedPhotoIds, [1, 3, 4, 6]);
});

test('delete mode clears comparison selections and allows more than 200 selections', () => {
  const photos = makePhotos(250);
  useAppStore.getState().togglePhotoSelection(photos[0]);
  useAppStore.getState().setDeleteMode(true);
  assert.deepEqual(useAppStore.getState().selectedPhotoIds, []);
  assert.deepEqual(useAppStore.getState().selectedPhotos, []);
  photos.forEach((photo) => useAppStore.getState().togglePhotoSelection(photo));
  assert.equal(useAppStore.getState().selectedPhotos.length, 250);
  assert.equal(useAppStore.getState().selectedPhotoIds.length, 250);
  useAppStore.getState().togglePhotoSelection(photos[199]);
  assert.equal(useAppStore.getState().selectedPhotoIds.length, 249);
  assert.equal(useAppStore.getState().selectedPhotoIds.includes(200), false);
});

test('leaving delete mode clears deletion targets and restores the four-photo limit', () => {
  const photos = makePhotos(10);
  useAppStore.getState().setDeleteMode(true);
  photos.forEach((photo) => useAppStore.getState().togglePhotoSelection(photo));
  useAppStore.getState().setDeleteMode(false);
  assert.equal(useAppStore.getState().isDeleteMode, false);
  assert.deepEqual(useAppStore.getState().selectedPhotoIds, []);
  assert.deepEqual(useAppStore.getState().selectedPhotos, []);
  photos.forEach((photo) => useAppStore.getState().togglePhotoSelection(photo));
  assert.equal(useAppStore.getState().selectedPhotoIds.length, 4);
});

test('leaving the grid in normal mode preserves comparison selections', () => {
  useAppStore.getState().togglePhotoSelection(makePhotos(1)[0]);
  useAppStore.getState().setDeleteMode(false);
  assert.deepEqual(useAppStore.getState().selectedPhotoIds, [1]);
});

test('deletion keeps failed and newly selected photos and restarts pagination', () => {
  const photos = [1, 2, 3, 4].map((id) => ({ id, file_name: `${id}.jpg` }));
  useAppStore.setState({
    photos, page: 3, totalPhotos: 130, totalPages: 3,
    selectedPhotoIds: [1, 2, 4], selectedPhotos: [photos[0], photos[1], photos[3]],
    currentPhotoId: 1, lastViewedPhotoId: 1, randomKey: 5,
    selectedFolderPath: 'C:/photos', dateFrom: '2026-01-01',
  });

  useAppStore.getState().removePhotos([1]);
  const state = useAppStore.getState();
  assert.deepEqual(state.selectedPhotoIds, [2, 4]);
  assert.deepEqual(state.selectedPhotos.map((photo) => photo.id), [2, 4]);
  assert.deepEqual(state.photos, []);
  assert.equal(state.page, 1);
  assert.equal(state.randomKey, 6);
  assert.equal(state.currentPhotoId, null);
  assert.equal(state.lastViewedPhotoId, null);
  assert.equal(state.selectedFolderPath, 'C:/photos');
  assert.equal(state.dateFrom, '2026-01-01');
});
