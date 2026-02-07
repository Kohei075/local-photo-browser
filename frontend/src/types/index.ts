export interface PersonTagBrief {
  id: number;
  name: string;
}

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
  person_tags: PersonTagBrief[];
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

export interface PersonTag {
  id: number;
  name: string;
  created_at: string;
  photo_count: number;
}

export interface Settings {
  root_folder: string;
  extensions: string;
  slideshow_interval: string;
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
