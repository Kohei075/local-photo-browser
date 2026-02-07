import { useState, useEffect } from 'react';

interface FolderSettingProps {
  currentFolder: string;
  extensions: string;
  onSave: (folder: string, extensions: string) => void;
}

export function FolderSetting({ currentFolder, extensions, onSave }: FolderSettingProps) {
  const [folder, setFolder] = useState(currentFolder);
  const [exts, setExts] = useState(extensions);

  useEffect(() => {
    setFolder(currentFolder);
    setExts(extensions);
  }, [currentFolder, extensions]);

  const handleSave = () => {
    onSave(folder, exts);
  };

  return (
    <div className="setting-section">
      <h3>Photo Folder</h3>
      <div className="setting-row">
        <label>Root Folder Path:</label>
        <input
          type="text"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="e.g., C:\Users\Photos"
          className="setting-input"
        />
      </div>
      <div className="setting-row">
        <label>File Extensions:</label>
        <input
          type="text"
          value={exts}
          onChange={(e) => setExts(e.target.value)}
          placeholder="jpg,jpeg,png,webp"
          className="setting-input"
        />
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
}
