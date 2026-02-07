import { useSettings } from '../hooks/useSettings';
import { FolderSetting } from '../components/settings/FolderSetting';
import { ScanButton } from '../components/settings/ScanButton';
import { SlideshowSetting } from '../components/settings/SlideshowSetting';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function SettingsPage() {
  const {
    settings, loading, updateSettings, startScan, pollScanStatus, clearCache, resetDb,
  } = useSettings();

  if (loading || !settings) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <FolderSetting
        currentFolder={settings.root_folder}
        extensions={settings.extensions}
        onSave={(folder, exts) => updateSettings({ root_folder: folder, extensions: exts })}
      />

      <ScanButton onStartScan={startScan} onPollStatus={pollScanStatus} />

      <SlideshowSetting
        currentInterval={settings.slideshow_interval}
        onSave={(interval) => updateSettings({ slideshow_interval: interval })}
      />

      <div className="setting-section">
        <h3>Maintenance</h3>
        <div className="setting-row setting-actions">
          <button className="btn" onClick={clearCache}>
            Clear Thumbnail Cache
          </button>
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Reset database? All favorites and tags will be lost.')) {
              resetDb();
            }
          }}>
            Reset Database
          </button>
        </div>
      </div>
    </div>
  );
}
