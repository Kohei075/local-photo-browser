import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { SortBy, SortOrder, DateField } from '../../types';

export function SortBar() {
  const {
    sortBy, sortOrder, setSortBy, setSortOrder, totalPhotos, refreshRandom, gridColumns, setGridColumns,
    dateField, dateFrom, dateTo, setDateField, setDateFrom, setDateTo, clearDateRange,
  } = useAppStore(useShallow((state) => ({
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    setSortBy: state.setSortBy,
    setSortOrder: state.setSortOrder,
    totalPhotos: state.totalPhotos,
    refreshRandom: state.refreshRandom,
    gridColumns: state.gridColumns,
    setGridColumns: state.setGridColumns,
    dateField: state.dateField,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    setDateField: state.setDateField,
    setDateFrom: state.setDateFrom,
    setDateTo: state.setDateTo,
    clearDateRange: state.clearDateRange,
  })));
  const { t } = useTranslation();

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'created_at', label: t('grid.sortCreated') },
    { value: 'modified_at', label: t('grid.sortModified') },
    { value: 'file_name', label: t('grid.sortFileName') },
    { value: 'random', label: t('grid.sortRandom') },
  ];

  const dateFieldOptions: { value: DateField; label: string }[] = [
    { value: 'modified_at', label: t('grid.sortModified') },
    { value: 'created_at', label: t('grid.sortCreated') },
    { value: 'taken_at', label: t('grid.sortTaken') },
  ];

  const hasDateRange = dateFrom !== '' || dateTo !== '';

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
      <div className={`date-range${hasDateRange ? ' date-range-active' : ''}`}>
        <label>{t('grid.dateRange')}: </label>
        <select
          value={dateField}
          onChange={(e) => setDateField(e.target.value as DateField)}
        >
          {dateFieldOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          title={t('grid.dateFrom')}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <span className="date-range-sep">-</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          title={t('grid.dateTo')}
          onChange={(e) => setDateTo(e.target.value)}
        />
        {hasDateRange && (
          <button
            className="btn btn-sm date-range-clear"
            onClick={clearDateRange}
            title={t('grid.clearDateRange')}
          >
            &times;
          </button>
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
