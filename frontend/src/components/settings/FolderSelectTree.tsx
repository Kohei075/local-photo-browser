import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';
import type { FolderNode } from '../../types';

interface FolderSelectTreeProps {
  rootFolder: string;
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
}: {
  node: FolderNode;
  depth: number;
  ancestors: string[];
  excluded: Set<string>;
  onToggle: (node: FolderNode, ancestors: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const checkState = getCheckState(node, excluded);
  const checkboxRef = useRef<HTMLInputElement>(null);

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
          />
        ))}
    </div>
  );
}

export function FolderSelectTree({ rootFolder }: FolderSelectTreeProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!rootFolder) {
      setFolders([]);
      return;
    }
    setLoading(true);
    Promise.all([
      api.get<{ folders: FolderNode[] }>(
        `/folders/browse?path=${encodeURIComponent(rootFolder)}`,
      ),
      api.get<{ excluded_folders: string[] }>('/settings/excluded-folders'),
    ])
      .then(([treeData, excludedData]) => {
        setFolders(treeData.folders);
        setExcluded(new Set(excludedData.excluded_folders));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rootFolder]);

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

  return (
    <div className="setting-section">
      <h3>{t('settings.folderSelect')}</h3>
      <p className="scan-info-text" style={{ marginBottom: '8px' }}>
        {t('settings.folderSelectDesc')}
      </p>
      <div className="folder-select-tree">
        {folders.map((node) => (
          <FolderCheckItem
            key={node.path}
            node={node}
            depth={0}
            ancestors={[]}
            excluded={excluded}
            onToggle={toggleFolder}
          />
        ))}
      </div>
      <div className="setting-row" style={{ marginTop: '12px', marginBottom: 0 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving}
        >
          {t('settings.saveSelection')}
        </button>
        {saved && <span className="success-text">{t('settings.saved')}</span>}
      </div>
    </div>
  );
}
