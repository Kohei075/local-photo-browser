import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { SortBy, SortOrder } from '../../types';

export function SortBar() {
  const { sortBy, sortOrder, setSortBy, setSortOrder, totalPhotos, refreshRandom, gridColumns, setGridColumns } = useAppStore();
  const { t } = useTranslation();

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'created_at', label: t('grid.sortCreated') },
    { value: 'modified_at', label: t('grid.sortModified') },
    { value: 'file_name', label: t('grid.sortFileName') },
    { value: 'random', label: t('grid.sortRandom') },
  ];

  const orderLabel = sortBy === 'file_name'
    ? { desc: t('grid.zaOrder'), asc: t('grid.azOrder') }
    : { desc: t('grid.newestFirst'), asc: t('grid.oldestFirst') };

  return (
    <div className="sort-bar">
      <span className="sort-bar-count">{totalPhotos} {t('grid.photos')}</span>
      <div className="sort-bar-controls">
        <label>{t('grid.sortBy')}: </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {sortBy === 'random' ? (
          <button
            className="btn btn-sm sort-refresh-btn"
            onClick={refreshRandom}
            title={t('grid.refresh')}
          >
            &#8635;
          </button>
        ) : (
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          >
            <option value="desc">{orderLabel.desc}</option>
            <option value="asc">{orderLabel.asc}</option>
          </select>
        )}
      </div>
      <input
        type="range"
        className="grid-size-slider"
        min={2}
        max={8}
        value={10 - gridColumns}
        onChange={(e) => setGridColumns(10 - Number(e.target.value))}
      />
    </div>
  );
}
