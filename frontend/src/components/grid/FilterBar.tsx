import { useShallow } from 'zustand/react/shallow';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n/useTranslation';
import { api } from '../../api/client';
import { isVideo } from '../../utils/media';
import { appendPhotoFilters } from '../../utils/photoParams';
import type { PhotoListResponse } from '../../types';

export function FilterBar() {
  const { selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo, selectedPhotoIds, selectedPhotos, togglePhotoSelection, clearPhotoSelection } = useAppStore(useShallow((state) => ({
    selectedFolderPath: state.selectedFolderPath,
    includeSubfolders: state.includeSubfolders,
    mediaFilter: state.mediaFilter,
    dateField: state.dateField,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    selectedPhotoIds: state.selectedPhotoIds,
    selectedPhotos: state.selectedPhotos,
    togglePhotoSelection: state.togglePhotoSelection,
    clearPhotoSelection: state.clearPhotoSelection,
  })));
  const { t } = useTranslation();
  const isDeleteMode = useAppStore((state) => state.isDeleteMode);
  const navigate = useNavigate();

  const handleRandomPicks = useCallback(async () => {
    const params = new URLSearchParams({
      sort_by: 'random',
      per_page: '4',
    });
    appendPhotoFilters(params, { selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo });
    try {
      const res = await api.get<PhotoListResponse>(`/photos?${params}`);
      if (res.items.length > 0) {
        navigate(`/viewer/${res.items[0].id}`, { state: { randomPicks: res.items } });
      }
    } catch { /* ignore */ }
  }, [selectedFolderPath, includeSubfolders, mediaFilter, dateField, dateFrom, dateTo, navigate]);

  const handleViewSelected = useCallback(() => {
    if (!isDeleteMode && selectedPhotos.length > 0) {
      navigate(`/viewer/${selectedPhotos[0].id}`, { state: { randomPicks: selectedPhotos } });
    }
  }, [isDeleteMode, selectedPhotos, navigate]);

  return (
    <div className="filter-bar">
      {isDeleteMode ? (
        <span className="delete-mode-hint" role="status">{t('grid.deleteModeHint', { count: selectedPhotoIds.length })}</span>
      ) : (
        <button className="btn btn-sm" onClick={handleRandomPicks}>
          {t('viewer.randomPicks')}
        </button>
      )}
      {selectedPhotoIds.length > 0 && (
        <>
          {!isDeleteMode && (
            <>
              <button className="btn btn-sm btn-primary" onClick={handleViewSelected}>
                {t('grid.viewSelected', { count: selectedPhotoIds.length })}
              </button>
              <div className="selection-thumbnails">
                {selectedPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    className="selection-thumbnail-btn"
                    onClick={() => togglePhotoSelection(photo)}
                    title={photo.file_name}
                  >
                    {isVideo(photo.extension) ? (
                      <span className="selection-thumbnail selection-thumbnail-video">&#9654;</span>
                    ) : (
                      <img
                        src={photo.thumbnail_url}
                        alt={photo.file_name}
                        className="selection-thumbnail"
                      />
                    )}
                    <span className="selection-thumbnail-remove">x</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="btn btn-sm" onClick={clearPhotoSelection}>
            {t('grid.clearSelection')}
          </button>
        </>
      )}
    </div>
  );
}
