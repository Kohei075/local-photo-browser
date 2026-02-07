export interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  extension: string;
  file_size: number;
  width: number | null;
  height: number | null;
  created_at: string;
  modified_at: string;
  taken_at: string | null;
  is_favorite: boolean;
  thumbnail_url: string;
}

export interface PhotoListResponse {
  items: Photo[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface NeighborsResponse {
  prev_id: number | null;
  next_id: number | null;
}

export interface Settings {
  root_folder: string;
  extensions: string;
  thumbnail_size: string;
}

export interface ScanStatus {
  is_scanning: boolean;
  total: number;
  processed: number;
  current_file: string;
  error: string | null;
}

export type SortBy = 'created_at' | 'modified_at' | 'taken_at' | 'file_name' | 'random';
export type SortOrder = 'asc' | 'desc';

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

export interface FolderTreeResponse {
  root: string;
  folders: FolderNode[];
}

export interface SearchResult {
  type: 'folder' | 'file';
  name: string;
  path: string;
  photo_id?: number;
}

export interface SearchResponse {
  results: SearchResult[];
}
