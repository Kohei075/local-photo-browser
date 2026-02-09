import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n/useTranslation';
import { api } from '../../api/client';
import type { PhotoListResponse } from '../../types';

export function FilterBar() {
  const { selectedFolderPath } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRandomPicks = useCallback(async () => {
    const params = new URLSearchParams({
      sort_by: 'random',
      per_page: '3',
    });
    if (selectedFolderPath !== null) params.set('folder_path', selectedFolderPath);
    try {
      const res = await api.get<PhotoListResponse>(`/photos?${params}`);
      if (res.items.length > 0) {
        navigate(`/viewer/${res.items[0].id}`, { state: { randomPicks: res.items } });
      }
    } catch { /* ignore */ }
  }, [selectedFolderPath, navigate]);

  return (
    <div className="filter-bar">
      <button className="btn btn-sm" onClick={handleRandomPicks}>
        {t('viewer.randomPicks')}
      </button>
    </div>
  );
}
