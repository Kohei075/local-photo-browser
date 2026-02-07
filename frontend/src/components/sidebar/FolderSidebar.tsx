import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { FolderTreeResponse, SearchResponse, FolderNode } from '../../types';

function FolderTreeItem({ node, depth, onSelect }: { node: FolderNode; depth: number; onSelect: (path: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedFolderPath } = useAppStore();
  const isSelected = selectedFolderPath === node.path;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`folder-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(isSelected ? null : node.path)}
      >
        {hasChildren ? (
          <button
            className="folder-tree-toggle"
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          >
            {isOpen ? '\u25BE' : '\u25B8'}
          </button>
        ) : (
          <span className="folder-tree-spacer" />
        )}
        <span className="folder-tree-icon">{isOpen && hasChildren ? '\uD83D\uDCC2' : '\uD83D\uDCC1'}</span>
        <span className="folder-tree-name" title={node.path}>{node.name}</span>
      </div>
      {isOpen && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem key={child.path} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSidebar() {
  const { folderTree, folderRoot, setFolderTree, selectedFolderPath, setSelectedFolderPath, isSidebarOpen, setIsSidebarOpen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse['results']>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleFolderSelect = useCallback((path: string | null) => {
    setSelectedFolderPath(path);
    if (location.pathname.startsWith('/viewer')) {
      navigate('/');
    }
  }, [setSelectedFolderPath, location.pathname, navigate]);

  // Fetch folder tree on mount
  useEffect(() => {
    api.get<FolderTreeResponse>('/folders').then((data) => {
      setFolderTree(data.root, data.folders);
    }).catch(() => {});
  }, [setFolderTree]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await api.get<SearchResponse>(`/folders/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  const handleResultClick = (result: SearchResponse['results'][0]) => {
    if (result.type === 'folder') {
      handleFolderSelect(result.path);
      setSearchQuery('');
      setSearchResults([]);
    } else if (result.photo_id) {
      navigate(`/viewer/${result.photo_id}`);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  if (!isSidebarOpen) {
    return (
      <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)} title="Show sidebar">
        {'\u25B6'}
      </button>
    );
  }

  return (
    <aside className="folder-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{t('sidebar.folders')}</span>
        <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} title="Hide sidebar">
          {'\u25C0'}
        </button>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder={t('sidebar.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sidebar-search-input"
        />
      </div>

      {searchQuery.trim() ? (
        <div className="sidebar-search-results">
          {isSearching && <div className="sidebar-loading">{t('sidebar.searching')}</div>}
          {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
            <div className="sidebar-empty">{t('sidebar.noResults')}</div>
          )}
          {searchResults.map((result, i) => (
            <div
              key={`${result.type}-${result.path}-${i}`}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <span className="search-result-icon">
                {result.type === 'folder' ? '\uD83D\uDCC1' : '\uD83D\uDDBC\uFE0F'}
              </span>
              <div className="search-result-info">
                <span className="search-result-name">{result.name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="sidebar-tree">
          {selectedFolderPath && (
            <button className="sidebar-clear-btn" onClick={() => handleFolderSelect(null)}>
              {t('sidebar.allPhotos')}
            </button>
          )}
          {folderRoot && (
            <div className="folder-tree-root" title={folderRoot}>
              {folderRoot.split(/[/\\]/).pop() || folderRoot}
            </div>
          )}
          {folderTree.map((node) => (
            <FolderTreeItem key={node.path} node={node} depth={0} onSelect={handleFolderSelect} />
          ))}
          {folderTree.length === 0 && (
            <div className="sidebar-empty">{t('sidebar.noFolders')}</div>
          )}
        </div>
      )}
    </aside>
  );
}
