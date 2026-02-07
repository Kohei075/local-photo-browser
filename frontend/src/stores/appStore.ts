import { create } from 'zustand';
import type { Photo, PersonTag, SortBy, SortOrder, ScanStatus } from '../types';

interface AppState {
  // Photos
  photos: Photo[];
  totalPhotos: number;
  page: number;
  perPage: number;
  totalPages: number;
  isLoadingPhotos: boolean;

  // Sort / Filter
  sortBy: SortBy;
  sortOrder: SortOrder;
  favoriteOnly: boolean;
  personTagId: number | null;

  // Viewer
  currentPhotoId: number | null;

  // Slideshow
  isSlideshowPlaying: boolean;
  slideshowInterval: number;

  // Scan
  scanStatus: ScanStatus | null;

  // Tags
  personTags: PersonTag[];

  // Actions
  setPhotos: (photos: Photo[], total: number, page: number, perPage: number, totalPages: number) => void;
  appendPhotos: (photos: Photo[], total: number, page: number, totalPages: number) => void;
  setLoadingPhotos: (loading: boolean) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  setFavoriteOnly: (favoriteOnly: boolean) => void;
  setPersonTagId: (personTagId: number | null) => void;
  setCurrentPhotoId: (id: number | null) => void;
  setSlideshowPlaying: (playing: boolean) => void;
  setSlideshowInterval: (interval: number) => void;
  setScanStatus: (status: ScanStatus | null) => void;
  setPersonTags: (tags: PersonTag[]) => void;
  updatePhoto: (photo: Photo) => void;
  resetFilters: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  photos: [],
  totalPhotos: 0,
  page: 1,
  perPage: 50,
  totalPages: 0,
  isLoadingPhotos: false,

  sortBy: 'created_at',
  sortOrder: 'desc',
  favoriteOnly: false,
  personTagId: null,

  currentPhotoId: null,

  isSlideshowPlaying: false,
  slideshowInterval: 5,

  scanStatus: null,

  personTags: [],

  setPhotos: (photos, total, page, perPage, totalPages) =>
    set({ photos, totalPhotos: total, page, perPage, totalPages }),
  appendPhotos: (photos, total, page, totalPages) =>
    set((state) => ({
      photos: [...state.photos, ...photos],
      totalPhotos: total,
      page,
      totalPages,
    })),
  setLoadingPhotos: (isLoadingPhotos) => set({ isLoadingPhotos }),
  setSortBy: (sortBy) => set({ sortBy, photos: [], page: 1 }),
  setSortOrder: (sortOrder) => set({ sortOrder, photos: [], page: 1 }),
  setFavoriteOnly: (favoriteOnly) => set({ favoriteOnly, photos: [], page: 1 }),
  setPersonTagId: (personTagId) => set({ personTagId, photos: [], page: 1 }),
  setCurrentPhotoId: (currentPhotoId) => set({ currentPhotoId }),
  setSlideshowPlaying: (isSlideshowPlaying) => set({ isSlideshowPlaying }),
  setSlideshowInterval: (slideshowInterval) => set({ slideshowInterval }),
  setScanStatus: (scanStatus) => set({ scanStatus }),
  setPersonTags: (personTags) => set({ personTags }),
  updatePhoto: (photo) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === photo.id ? photo : p)),
    })),
  resetFilters: () => set({ favoriteOnly: false, personTagId: null, photos: [], page: 1 }),
}));
