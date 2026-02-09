import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

interface FolderSettingProps {
  currentFolder: string;
  extensions: string;
  onSave: (folder: string, extensions: string) => Promise<unknown>;
}

export function FolderSetting({ currentFolder, extensions, onSave }: FolderSettingProps) {
  const [folder, setFolder] = useState(currentFolder);
  const [exts, setExts] = useState(extensions);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setFolder(currentFolder);
    setExts(extensions);
  }, [currentFolder, extensions]);

  const handleSave = async () => {
    setError('');
    setSaved(false);
    try {
      await onSave(folder, exts);
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
      <div className="setting-row">
        <label>{t('settings.extensions')}</label>
        <input
          type="text"
          value={exts}
          onChange={(e) => setExts(e.target.value)}
          placeholder="jpg,jpeg,png,webp"
          className="setting-input setting-input-ext"
        />
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        {t('settings.save')}
      </button>
      {saved && <p className="success-text">{t('settings.saved')}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
