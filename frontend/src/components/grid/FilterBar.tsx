import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n/useTranslation';

export function FilterBar() {
  const { favoriteOnly, setFavoriteOnly, resetFilters } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="filter-bar">
      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={favoriteOnly}
          onChange={(e) => setFavoriteOnly(e.target.checked)}
        />
        {t('filter.favoritesOnly')}
      </label>

      {favoriteOnly && (
        <button className="btn btn-sm" onClick={resetFilters}>
          {t('filter.clear')}
        </button>
      )}
    </div>
  );
}
