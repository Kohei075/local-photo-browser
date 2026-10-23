import { create } from 'zustand';
import type { Photo, SortBy, SortOrder, MediaFilter, DateField, ScanStatus, FolderNode } from '../types';

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
  randomKey: number;
  gridColumns: number;

  // Date range filter (empty string = unbounded)
  dateField: DateField;
  dateFrom: string;
  dateTo: string;

  // Viewer
  currentPhotoId: number | null;

  // Last viewed photo id (for restoring scroll position when returning to grid)
  lastViewedPhotoId: number | null;

  // Photo selection (up to 4 for viewing; unlimited in delete mode)
  isDeleteMode: boolean;
  selectedPhotoIds: number[];
  selectedPhotos: Photo[];

  // Scan
  scanStatus: ScanStatus | null;

  // Folder sidebar
  folderTree: FolderNode[];
  folderRoot: string;
  selectedFolderPath: string | null;
  includeSubfolders: boolean;
  mediaFilter: MediaFilter;
  isSidebarOpen: boolean;

  // Actions
  setPhotos: (photos: Photo[], total: number, page: number, perPage: number, totalPages: number) => void;
  appendPhotos: (photos: Photo[], total: number, page: number, totalPages: number) => void;
  setLoadingPhotos: (loading: boolean) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  setDateField: (field: DateField) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  clearDateRange: () => void;
  setCurrentPhotoId: (id: number | null) => void;
  setScanStatus: (status: ScanStatus | null) => void;
  updatePhoto: (photo: Photo) => void;
  removePhotos: (ids: number[]) => void;
  setGridColumns: (columns: number) => void;
  refreshRandom: () => void;
  resetFilters: () => void;
  setFolderTree: (root: string, folders: FolderNode[]) => void;
  setSelectedFolderPath: (path: string | null) => void;
  setIncludeSubfolders: (include: boolean) => void;
  setMediaFilter: (filter: MediaFilter) => void;
  setIsSidebarOpen: (open: boolean) => void;
  togglePhotoSelection: (photo: Photo) => void;
  setDeleteMode: (enabled: boolean) => void;
  clearPhotoSelection: () => void;
  setLastViewedPhotoId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  photos: [],
  totalPhotos: 0,
  page: 1,
  perPage: 50,
  totalPages: 0,
  isLoadingPhotos: false,

  sortBy: 'modified_at',
  sortOrder: 'desc',
  randomKey: 0,
  gridColumns: Number(localStorage.getItem('grid_columns')) || 4,

  dateField: (localStorage.getItem('date_field') as DateField | null) ?? 'modified_at',
  dateFrom: '',
  dateTo: '',

  currentPhotoId: null,

  lastViewedPhotoId: null,

  selectedPhotoIds: [],
  selectedPhotos: [],
  isDeleteMode: false,

  scanStatus: null,

  folderTree: [],
  folderRoot: '',
  selectedFolderPath: null,
  includeSubfolders: localStorage.getItem('include_subfolders') !== '0',
  mediaFilter: (localStorage.getItem('media_filter') as MediaFilter | null) ?? 'all',
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
  setSortBy: (sortBy) => set({ sortBy, sortOrder: sortBy === 'file_name' ? 'asc' : 'desc', photos: [], page: 1 }),
  setSortOrder: (sortOrder) => set({ sortOrder, photos: [], page: 1 }),
  setDateField: (dateField) => {
    localStorage.setItem('date_field', dateField);
    set({ dateField, photos: [], page: 1 });
  },
  setDateFrom: (dateFrom) => set({ dateFrom, photos: [], page: 1 }),
  setDateTo: (dateTo) => set({ dateTo, photos: [], page: 1 }),
  clearDateRange: () => set({ dateFrom: '', dateTo: '', photos: [], page: 1 }),
  setCurrentPhotoId: (currentPhotoId) => set({ currentPhotoId }),
  setScanStatus: (scanStatus) => set({ scanStatus }),
  updatePhoto: (photo) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === photo.id ? photo : p)),
    })),
  removePhotos: (ids) => {
    const removed = new Set(ids);
    set((state) => ({
      // Reload pagination after removing files so offset-based loading skips none.
      photos: [],
      page: 1,
      randomKey: state.randomKey + 1,
      selectedPhotoIds: state.selectedPhotoIds.filter((id) => !removed.has(id)),
      selectedPhotos: state.selectedPhotos.filter((photo) => !removed.has(photo.id)),
      currentPhotoId: state.currentPhotoId !== null && removed.has(state.currentPhotoId) ? null : state.currentPhotoId,
      lastViewedPhotoId: state.lastViewedPhotoId !== null && removed.has(state.lastViewedPhotoId) ? null : state.lastViewedPhotoId,
    }));
  },
  setGridColumns: (gridColumns) => { localStorage.setItem('grid_columns', String(gridColumns)); set({ gridColumns }); },
  refreshRandom: () => set((state) => ({ randomKey: state.randomKey + 1, photos: [], page: 1 })),
  resetFilters: () => set({ selectedFolderPath: null, photos: [], page: 1 }),
  setFolderTree: (folderRoot, folderTree) => set({ folderRoot, folderTree }),
  setSelectedFolderPath: (selectedFolderPath) => set({ selectedFolderPath, photos: [], page: 1 }),
  setIncludeSubfolders: (includeSubfolders) => {
    localStorage.setItem('include_subfolders', includeSubfolders ? '1' : '0');
    set({ includeSubfolders, photos: [], page: 1 });
  },
  setMediaFilter: (mediaFilter) => {
    localStorage.setItem('media_filter', mediaFilter);
    set({ mediaFilter, photos: [], page: 1 });
  },
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  togglePhotoSelection: (photo) =>
    set((state) => {
      if (state.selectedPhotoIds.includes(photo.id)) {
        return {
          selectedPhotoIds: state.selectedPhotoIds.filter((pid) => pid !== photo.id),
          selectedPhotos: state.selectedPhotos.filter((p) => p.id !== photo.id),
        };
      }
      if (!state.isDeleteMode && state.selectedPhotoIds.length >= 4) return state;
      return {
        selectedPhotoIds: [...state.selectedPhotoIds, photo.id],
        selectedPhotos: [...state.selectedPhotos, photo],
      };
    }),
  clearPhotoSelection: () => set({ selectedPhotoIds: [], selectedPhotos: [] }),
  setDeleteMode: (isDeleteMode) => set((state) => state.isDeleteMode === isDeleteMode ? state : ({
    isDeleteMode,
    selectedPhotoIds: [],
    selectedPhotos: [],
  })),
  setLastViewedPhotoId: (lastViewedPhotoId) => set({ lastViewedPhotoId }),
}));
