import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';
import { usePhotos } from '../../hooks/usePhotos';
import type { FolderNode } from '../../types';

interface FolderSelectTreeProps {
  rootFolder: string;
  extensions: string;
}

function getAllPaths(node: FolderNode): string[] {
  return [node.path, ...node.children.flatMap(getAllPaths)];
}

function getCheckState(
  node: FolderNode,
  excluded: Set<string>,
): 'checked' | 'unchecked' | 'indeterminate' {
  const paths = getAllPaths(node);
  const excludedCount = paths.filter((p) => excluded.has(p)).length;
  if (excludedCount === 0) return 'checked';
  if (excludedCount === paths.length) return 'unchecked';
  return 'indeterminate';
}

function FolderCheckItem({
  node,
  depth,
  ancestors,
  excluded,
  onToggle,
  onDeleteFolder,
  deleteDisabled,
}: {
  node: FolderNode;
  depth: number;
  ancestors: string[];
  excluded: Set<string>;
  onToggle: (node: FolderNode, ancestors: string[]) => void;
  onDeleteFolder: (path: string) => void;
  deleteDisabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const checkState = getCheckState(node, excluded);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = checkState === 'indeterminate';
    }
  }, [checkState]);

  const childAncestors = [...ancestors, node.path];

  return (
    <div>
      <div
        className="folder-check-item"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checkState !== 'unchecked'}
          onChange={() => onToggle(node, ancestors)}
          className="folder-checkbox"
        />
        {hasChildren ? (
          <button
            className="folder-tree-toggle"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '\u25BE' : '\u25B8'}
          </button>
        ) : (
          <span className="folder-tree-spacer" />
        )}
        <span className="folder-check-name" title={node.path}>
          {node.name}
        </span>
        {node.scanned && (
          <>
            <span className="folder-scanned-badge">{t('settings.scanned')}</span>
            <button
              className="folder-delete-btn"
              onClick={() => onDeleteFolder(node.path)}
              disabled={deleteDisabled}
              title={t('settings.deleteFolderData')}
              aria-label={t('settings.deleteFolderData')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </>
        )}
      </div>
      {isOpen &&
        hasChildren &&
        node.children.map((child) => (
          <FolderCheckItem
            key={child.path}
            node={child}
            depth={depth + 1}
            ancestors={childAncestors}
            excluded={excluded}
            onToggle={onToggle}
            onDeleteFolder={onDeleteFolder}
            deleteDisabled={deleteDisabled}
          />
        ))}
    </div>
  );
}

function getSelectedTargets(node: FolderNode, excluded: Set<string>): string[] {
  if (excluded.has(node.path)) {
    return node.children.flatMap((c) => getSelectedTargets(c, excluded));
  }
  return [node.path];
}

export function FolderSelectTree({ rootFolder, extensions }: FolderSelectTreeProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [rescanProgress, setRescanProgress] = useState<{ processed: number; total: number } | null>(null);
  const [rescanResult, setRescanResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ processed: number; total: number } | null>(null);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { t } = useTranslation();
  const { fetchPhotos } = usePhotos();

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!rootFolder) {
      setFolders([]);
      return;
    }
    setLoading(true);
    Promise.all([
      api.get<{ folders: FolderNode[] }>(
        `/folders/browse?path=${encodeURIComponent(rootFolder)}&extensions=${encodeURIComponent(extensions)}`,
      ),
      api.get<{ excluded_folders: string[] }>('/settings/excluded-folders'),
    ])
      .then(([treeData, excludedData]) => {
        setFolders(treeData.folders);
        setExcluded(new Set(excludedData.excluded_folders));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rootFolder, extensions]);

  const toggleFolder = useCallback(
    (node: FolderNode, ancestors: string[]) => {
      const descendantPaths = getAllPaths(node);
      setExcluded((prev) => {
        const next = new Set(prev);
        const anyExcluded = descendantPaths.some((p) => next.has(p));
        if (anyExcluded) {
          // Include: remove descendants and ancestors from excluded
          descendantPaths.forEach((p) => next.delete(p));
          ancestors.forEach((p) => next.delete(p));
        } else {
          // Exclude: add all descendants
          descendantPaths.forEach((p) => next.add(p));
        }
        return next;
      });
      setSaved(false);
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/excluded-folders', {
        excluded_folders: Array.from(excluded),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleRescan = async () => {
    // Top-most non-excluded subtrees. The backend walks recursively and applies
    // excluded_folders to skip descendants the user has unchecked.
    const targets = folders.flatMap((n) => getSelectedTargets(n, excluded));
    if (targets.length === 0) return;

    setRescanning(true);
    setRescanProgress(null);
    setRescanResult(null);
    try {
      await api.post('/scan/partial', { folders: targets });
      // Poll scan status until done
      const poll = async () => {
        const status = await api.get<{
          is_scanning: boolean;
          processed: number;
          total: number;
        }>('/scan/status');
        setRescanProgress({ processed: status.processed, total: status.total });
        if (status.is_scanning) {
          pollTimerRef.current = setTimeout(poll, 500);
        } else {
          setRescanning(false);
          setRescanProgress(null);
          setRescanResult(
            t('settings.rescanComplete', { count: status.processed }),
          );
          pollTimerRef.current = setTimeout(() => setRescanResult(null), 5000);
        }
      };
      // Small delay before first poll to let the background task start
      pollTimerRef.current = setTimeout(poll, 500);
    } catch {
      setRescanning(false);
    }
  };

  const handleDeleteFolder = async (path: string) => {
    if (deleting || rescanning) return;
    if (!window.confirm(t('settings.deleteConfirm', { path }))) return;

    setDeleting(true);
    setDeleteProgress(null);
    setDeleteResult(null);
    try {
      await api.post('/scan/delete-folders', { folders: [path] });
      const poll = async () => {
        const status = await api.get<{
          is_deleting: boolean;
          processed: number;
          total: number;
        }>('/scan/delete-status');
        setDeleteProgress({ processed: status.processed, total: status.total });
        if (status.is_deleting) {
          pollTimerRef.current = setTimeout(poll, 500);
        } else {
          setDeleting(false);
          setDeleteResult(t('settings.deleteComplete', { count: status.total }));
          setDeleteProgress(null);
          // Refresh the gallery so removed photos disappear
          fetchPhotos(1, false);
          pollTimerRef.current = setTimeout(() => setDeleteResult(null), 5000);
        }
      };
      pollTimerRef.current = setTimeout(poll, 300);
    } catch {
      setDeleting(false);
    }
  };

  if (!rootFolder) return null;
  if (loading) {
    return (
      <div className="setting-section">
        <h3>{t('settings.folderSelect')}</h3>
        <p className="scan-info-text">{t('grid.loading')}</p>
      </div>
    );
  }
  if (folders.length === 0) return null;

  const selectAll = () => {
    setExcluded(new Set());
    setSaved(false);
  };

  const deselectAll = () => {
    const allPaths = folders.flatMap(getAllPaths);
    setExcluded(new Set(allPaths));
    setSaved(false);
  };

  return (
    <div className="setting-section">
      <h3>{t('settings.folderSelect')}</h3>
      <p className="scan-info-text" style={{ marginBottom: '8px' }}>
        {t('settings.folderSelectDesc')}
      </p>
      <div className="folder-select-actions">
        <button className="btn btn-sm" onClick={selectAll}>{t('settings.selectAll')}</button>
        <button className="btn btn-sm" onClick={deselectAll}>{t('settings.deselectAll')}</button>
      </div>
      <div className="folder-select-tree">
        {folders.map((node) => (
          <FolderCheckItem
            key={node.path}
            node={node}
            depth={0}
            ancestors={[]}
            excluded={excluded}
            onToggle={toggleFolder}
            onDeleteFolder={handleDeleteFolder}
            deleteDisabled={deleting || rescanning}
          />
        ))}
      </div>
      <div className="setting-row" style={{ marginTop: '12px', marginBottom: 0, gap: '8px' }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving}
        >
          {t('settings.saveSelection')}
        </button>
        <button
          className="btn btn-sm"
          onClick={handleRescan}
          disabled={rescanning || deleting}
        >
          {rescanning ? t('settings.rescanning') : t('settings.rescanSelected')}
        </button>
        {saved && <span className="success-text">{t('settings.saved')}</span>}
        {rescanResult && <span className="success-text">{rescanResult}</span>}
        {deleteResult && <span className="success-text">{deleteResult}</span>}
      </div>

      <p className="scan-info-text" style={{ marginTop: '8px' }}>
        {t('settings.deleteFolderHint')}
      </p>

      {rescanProgress && (
        <div className="scan-progress">
          <div className="scan-progress-bar">
            <div
              className="scan-progress-fill"
              style={{ width: rescanProgress.total > 0 ? `${(rescanProgress.processed / rescanProgress.total) * 100}%` : '0%' }}
            />
          </div>
          <p className="scan-progress-text">
            {t('settings.filesProcessed', { processed: rescanProgress.processed, total: rescanProgress.total })}
          </p>
        </div>
      )}

      {deleteProgress && (
        <div className="scan-progress">
          <div className="scan-progress-bar">
            <div
              className="scan-progress-fill"
              style={{ width: deleteProgress.total > 0 ? `${(deleteProgress.processed / deleteProgress.total) * 100}%` : '0%' }}
            />
          </div>
          <p className="scan-progress-text">
            {t('settings.deleteProgress', { processed: deleteProgress.processed, total: deleteProgress.total })}
          </p>
        </div>
      )}
    </div>
  );
}
