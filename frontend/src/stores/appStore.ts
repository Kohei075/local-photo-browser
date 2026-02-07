import { create } from 'zustand';
import type { Photo, SortBy, SortOrder, ScanStatus, FolderNode } from '../types';

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

  // Viewer
  currentPhotoId: number | null;

  // Scan
  scanStatus: ScanStatus | null;

  // Folder sidebar
  folderTree: FolderNode[];
  folderRoot: string;
  selectedFolderPath: string | null;
  isSidebarOpen: boolean;

  // Actions
  setPhotos: (photos: Photo[], total: number, page: number, perPage: number, totalPages: number) => void;
  appendPhotos: (photos: Photo[], total: number, page: number, totalPages: number) => void;
  setLoadingPhotos: (loading: boolean) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  setFavoriteOnly: (favoriteOnly: boolean) => void;
  setCurrentPhotoId: (id: number | null) => void;
  setScanStatus: (status: ScanStatus | null) => void;
  updatePhoto: (photo: Photo) => void;
  resetFilters: () => void;
  setFolderTree: (root: string, folders: FolderNode[]) => void;
  setSelectedFolderPath: (path: string | null) => void;
  setIsSidebarOpen: (open: boolean) => void;
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

  currentPhotoId: null,

  scanStatus: null,

  folderTree: [],
  folderRoot: '',
  selectedFolderPath: null,
  isSidebarOpen: true,

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
  setCurrentPhotoId: (currentPhotoId) => set({ currentPhotoId }),
  setScanStatus: (scanStatus) => set({ scanStatus }),
  updatePhoto: (photo) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === photo.id ? photo : p)),
    })),
  resetFilters: () => set({ favoriteOnly: false, selectedFolderPath: null, photos: [], page: 1 }),
  setFolderTree: (folderRoot, folderTree) => set({ folderRoot, folderTree }),
  setSelectedFolderPath: (selectedFolderPath) => set({ selectedFolderPath, photos: [], page: 1 }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));
