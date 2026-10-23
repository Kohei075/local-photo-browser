import type { MediaFilter, DateField } from '../types';

/** Gallery-wide filters shared by /photos, /photos/random and /neighbors. */
export interface PhotoFilters {
  selectedFolderPath: string | null;
  includeSubfolders: boolean;
  mediaFilter: MediaFilter;
  dateField: DateField;
  dateFrom: string;
  dateTo: string;
}

/** Append the gallery-wide filters to a photo API query string. */
export function appendPhotoFilters(params: URLSearchParams, f: PhotoFilters): URLSearchParams {
  if (f.selectedFolderPath !== null) {
    params.set('folder_path', f.selectedFolderPath);
    params.set('include_subfolders', f.includeSubfolders ? 'true' : 'false');
  }
  params.set('media_type', f.mediaFilter);
  if (f.dateFrom || f.dateTo) {
    params.set('date_field', f.dateField);
    if (f.dateFrom) params.set('date_from', f.dateFrom);
    if (f.dateTo) params.set('date_to', f.dateTo);
  }
  return params;
}
