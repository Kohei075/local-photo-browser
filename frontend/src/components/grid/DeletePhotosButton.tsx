import { useRef, useState } from 'react';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../stores/appStore';
import type { Photo, TrashPhotosResponse } from '../../types';

export function DeletePhotosButton() {
  const selectedPhotoIds = useAppStore((state) => state.selectedPhotoIds);
  const isDeleteMode = useAppStore((state) => state.isDeleteMode);
  const setDeleteMode = useAppStore((state) => state.setDeleteMode);
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<{ message: string; failed: boolean } | null>(null);
  const [photosToDelete, setPhotosToDelete] = useState<Photo[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);

  const openConfirmation = () => {
    if (pending.current || !useAppStore.getState().isDeleteMode) return;
    const photos = useAppStore.getState().selectedPhotos;
    if (photos.length === 0) return;
    setPhotosToDelete([...photos]);
    dialogRef.current?.showModal();
  };

  const handleDelete = async () => {
    if (pending.current || !useAppStore.getState().isDeleteMode) return;
    // Use exactly the files shown in the confirmation, even if selection changes.
    const ids = photosToDelete.map((photo) => photo.id);
    if (ids.length === 0) return;
    dialogRef.current?.close();

    pending.current = true;
    setIsDeleting(true);
    setResult(null);
    try {
      const response = await api.post<TrashPhotosResponse>('/photos/trash', { photo_ids: ids });
      if (response.deleted_ids.length > 0) {
        useAppStore.getState().removePhotos(response.deleted_ids);
      }
      const failures = response.failed.map((item) =>
        `${item.file_name || `#${item.id}`}: ${t(item.reason === 'not_found' ? 'grid.deleteNotFound' : 'grid.deleteFileFailed')}`
      );
      setResult({
        message: [t('grid.deleteComplete', { count: response.deleted_ids.length }), ...failures].join('\n'),
        failed: response.failed.length > 0,
      });
    } catch {
      setResult({ message: t('grid.deleteFailed'), failed: true });
    } finally {
      pending.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <div className="photo-delete-action" aria-busy={isDeleting}>
      <div className="photo-delete-buttons">
        <button
          type="button"
          className={`btn btn-sm${isDeleteMode ? ' btn-danger delete-mode-active' : ''}`}
          aria-pressed={isDeleteMode}
          disabled={isDeleting}
          onClick={() => {
            if (pending.current) return;
            dialogRef.current?.close();
            setPhotosToDelete([]);
            setResult(null);
            setDeleteMode(!isDeleteMode);
          }}
        >
          {t(isDeleteMode ? 'grid.deleteModeExit' : 'grid.deleteMode')}
        </button>
        {isDeleteMode && (
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={openConfirmation}
            disabled={selectedPhotoIds.length === 0 || isDeleting}
            title={t('grid.deleteHint')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
            </svg>
            {isDeleting ? t('grid.deleting') : t('grid.deleteSelected', { count: selectedPhotoIds.length })}
          </button>
        )}
      </div>
      {result && (
        <p className={`photo-delete-result ${result.failed ? 'error-text' : 'success-text'}`} role={result.failed ? 'alert' : 'status'}>
          {result.message}
        </p>
      )}
      <dialog ref={dialogRef} className="photo-delete-dialog" aria-labelledby="photo-delete-title">
        <form onSubmit={(event) => { event.preventDefault(); void handleDelete(); }}>
          <h3 id="photo-delete-title">{t('grid.deleteTitle')}</h3>
          <p>{t('grid.deleteConfirm', { count: photosToDelete.length })}</p>
          <ul className="photo-delete-files">
            {photosToDelete.map((photo) => <li key={photo.id} title={photo.file_path}>{photo.file_name}</li>)}
          </ul>
          <div className="photo-delete-dialog-actions">
            <button type="button" className="btn btn-sm" autoFocus onClick={() => dialogRef.current?.close()}>
              {t('grid.deleteCancel')}
            </button>
            <button type="submit" className="btn btn-sm btn-danger">{t('grid.deleteConfirmAction')}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
