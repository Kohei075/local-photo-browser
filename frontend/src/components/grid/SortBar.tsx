import { useAppStore } from '../../stores/appStore';
import type { SortBy, SortOrder } from '../../types';

export function SortBar() {
  const { sortBy, sortOrder, setSortBy, setSortOrder, totalPhotos } = useAppStore();

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'modified_at', label: 'Modified Date' },
    { value: 'taken_at', label: 'Taken Date' },
    { value: 'file_name', label: 'File Name' },
    { value: 'random', label: 'Random' },
  ];

  return (
    <div className="sort-bar">
      <span className="sort-bar-count">{totalPhotos} photos</span>
      <div className="sort-bar-controls">
        <label>Sort: </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {sortBy !== 'random' && (
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        )}
      </div>
    </div>
  );
}
