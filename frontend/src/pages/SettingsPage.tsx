import { useSettings } from '../hooks/useSettings';
import { FolderSetting } from '../components/settings/FolderSetting';
import { FolderSelectTree } from '../components/settings/FolderSelectTree';
import { ScanButton } from '../components/settings/ScanButton';
import { LanguageSetting } from '../components/settings/LanguageSetting';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useTranslation } from '../i18n/useTranslation';

export function SettingsPage() {
  const {
    settings, loading, updateSettings, startScan, pollScanStatus, clearCache, resetDb,
  } = useSettings();
  const { t } = useTranslation();

  if (loading || !settings) return <LoadingSpinner message={t('grid.loading')} />;

  return (
    <div className="settings-page">
      <h2>{t('settings.title')}</h2>

      <FolderSetting
        currentFolder={settings.root_folder}
        extensions={settings.extensions}
        onSave={(folder, exts) => updateSettings({ root_folder: folder, extensions: exts })}
      />

      <FolderSelectTree rootFolder={settings.root_folder} />

      <ScanButton
        rootFolder={settings.root_folder}
        onStartScan={startScan}
        onPollStatus={pollScanStatus}
      />

      <div className="setting-section">
        <h3>{t('settings.maintenance')}</h3>
        <LanguageSetting />
        <div className="setting-row setting-actions">
          <button className="btn" onClick={clearCache}>
            {t('settings.clearCache')}
          </button>
          <button className="btn btn-danger" onClick={() => {
            if (confirm(t('settings.resetConfirm'))) {
              resetDb();
            }
          }}>
            {t('settings.resetDb')}
          </button>
        </div>
      </div>
    </div>
  );
}
