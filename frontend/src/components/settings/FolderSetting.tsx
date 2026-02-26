import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

interface FolderSettingProps {
  currentFolder: string;
  onSave: (folder: string) => Promise<unknown>;
}

export function FolderSetting({ currentFolder, onSave }: FolderSettingProps) {
  const [folder, setFolder] = useState(currentFolder);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setFolder(currentFolder);
  }, [currentFolder]);

  const handleSave = async () => {
    setError('');
    setSaved(false);
    try {
      await onSave(folder);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t('settings.folderNotFound'));
    }
  };

  const handleBrowse = async () => {
    setPicking(true);
    try {
      const res = await api.post<{ path: string }>('/settings/pick-folder');
      if (res.path) {
        setFolder(res.path);
        setError('');
      }
    } catch { /* dialog cancelled or error */ }
    setPicking(false);
  };

  return (
    <div className="setting-section">
      <h3>{t('settings.photoFolder')}</h3>
      <div className="setting-row">
        <label>{t('settings.rootFolder')}</label>
        <input
          type="text"
          value={folder}
          onChange={(e) => { setFolder(e.target.value); setError(''); }}
          placeholder="e.g., C:\Users\Photos"
          className="setting-input setting-input-path"
        />
        <button className="btn btn-sm" onClick={handleBrowse} disabled={picking}>
          {t('settings.browse')}
        </button>
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        {t('settings.save')}
      </button>
      {saved && <p className="success-text">{t('settings.saved')}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
