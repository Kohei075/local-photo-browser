import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useTags } from '../../hooks/useTags';

export function FilterBar() {
  const { favoriteOnly, personTagId, personTags, setFavoriteOnly, setPersonTagId, resetFilters } = useAppStore();
  const { fetchTags } = useTags();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return (
    <div className="filter-bar">
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={favoriteOnly}
          onChange={(e) => setFavoriteOnly(e.target.checked)}
        />
        Favorites only
      </label>

      <select
        value={personTagId ?? ''}
        onChange={(e) => setPersonTagId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">All People</option>
        {personTags.map((tag) => (
          <option key={tag.id} value={tag.id}>{tag.name} ({tag.photo_count})</option>
        ))}
      </select>

      {(favoriteOnly || personTagId !== null) && (
        <button className="btn btn-sm" onClick={resetFilters}>
          Clear Filters
        </button>
      )}
    </div>
  );
}
