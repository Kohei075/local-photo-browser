import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';
import { isVideo } from '../utils/media';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Combination } from '../types';

type SortOrder = 'desc' | 'asc';

export function FavoritesPage() {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchCombinations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Combination[]>('/combinations');
      setCombinations(data);
    } catch {
      setCombinations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCombinations();
  }, [fetchCombinations]);

  const sorted = useMemo(() => {
    const arr = [...combinations];
    arr.sort((a, b) =>
      sortOrder === 'desc'
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at),
    );
    return arr;
  }, [combinations, sortOrder]);

  const handleView = (index: number) => {
    const combo = sorted[index];
    if (!combo || combo.photos.length === 0) return;
    // Pass the displayed (sorted) list + index so arrow keys move between
    // combinations in the same order shown here.
    navigate(`/viewer/${combo.photos[0].id}`, {
      state: { randomPicks: combo.photos, from: 'favorites', combos: sorted, index },
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('favorites.deleteConfirm'))) return;
    try {
      await api.delete(`/combinations/${id}`);
      setCombinations((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) return <LoadingSpinner message={t('grid.loading')} />;

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h2>{t('favorites.title')}</h2>
        {combinations.length > 0 && (
          <select
            className="favorites-sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          >
            <option value="desc">{t('grid.newestFirst')}</option>
            <option value="asc">{t('grid.oldestFirst')}</option>
          </select>
        )}
      </div>
      {combinations.length === 0 ? (
        <div className="empty-state">
          <p>{t('favorites.empty')}</p>
        </div>
      ) : (
        <div className="favorites-list">
          {sorted.map((combo, index) => (
            <div key={combo.id} className="favorite-combo">
              <button
                className="favorite-combo-thumbs"
                onClick={() => handleView(index)}
                title={t('favorites.view')}
              >
                {combo.photos.map((photo) => (
                  <div key={photo.id} className="favorite-combo-thumb">
                    <img src={photo.thumbnail_url} alt={photo.file_name} loading="lazy" />
                    {isVideo(photo.extension) && <span className="favorite-combo-play">&#9654;</span>}
                  </div>
                ))}
              </button>
              <div className="favorite-combo-actions">
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(combo.id)}>
                  {t('favorites.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
