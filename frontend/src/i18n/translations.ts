export type Lang = 'ja' | 'en';

const translations = {
  // Header
  'nav.gallery': { ja: 'ギャラリー', en: 'Gallery' },
  'nav.settings': { ja: '設定', en: 'Settings' },

  // Grid
  'grid.photos': { ja: '枚', en: 'photos' },
  'grid.sortBy': { ja: 'ソート', en: 'Sort by' },
  'grid.sortCreated': { ja: '作成日', en: 'Created Date' },
  'grid.sortModified': { ja: '更新日', en: 'Modified Date' },
  'grid.sortTaken': { ja: '撮影日', en: 'Taken Date' },
  'grid.sortFileName': { ja: 'ファイル名', en: 'File Name' },
  'grid.sortRandom': { ja: 'ランダム', en: 'Random' },
  'grid.newestFirst': { ja: '新しい順', en: 'Newest First' },
  'grid.oldestFirst': { ja: '古い順', en: 'Oldest First' },
  'grid.azOrder': { ja: '昇順', en: 'A→Z' },
  'grid.zaOrder': { ja: '降順', en: 'Z→A' },
  'grid.refresh': { ja: '更新', en: 'Refresh' },
  'grid.dateRange': { ja: '期間', en: 'Date Range' },
  'grid.dateFrom': { ja: '開始日', en: 'From' },
  'grid.dateTo': { ja: '終了日', en: 'To' },
  'grid.clearDateRange': { ja: '期間をクリア', en: 'Clear date range' },
  'grid.empty': { ja: '写真がありません。設定画面でフォルダを指定してスキャンを実行してください。', en: 'No photos found. Go to Settings to set your photo folder and run a scan.' },
  'grid.loading': { ja: '写真を読み込み中...', en: 'Loading photos...' },
  'grid.viewSelected': { ja: '選択した写真を表示 ({count})', en: 'View Selected ({count})' },
  'grid.clearSelection': { ja: '選択解除', en: 'Clear' },
  'grid.deleteSelected': { ja: '削除 ({count})', en: 'Delete ({count})' },
  'grid.deleteMode': { ja: '削除モード', en: 'Delete mode' },
  'grid.deleteModeExit': { ja: '削除モードを終了', en: 'Exit delete mode' },
  'grid.deleteModeRequired': { ja: '削除モードに切り替えてください', en: 'Enter delete mode first' },
  'grid.deleteModeHint': { ja: '削除する写真を選択（{count}件選択中・枚数制限なし）', en: 'Select files to delete ({count} selected, no selection limit)' },
  'grid.deleteTitle': { ja: '選択したファイルを削除', en: 'Delete selected files' },
  'grid.deleteCancel': { ja: 'キャンセル', en: 'Cancel' },
  'grid.deleteConfirmAction': { ja: 'ゴミ箱へ移動', en: 'Move to trash' },
  'grid.deleteHint': { ja: '選択したファイルをPCのゴミ箱へ移動', en: 'Move selected files to the computer’s trash' },
  'grid.deleteConfirm': { ja: '選択した{count}件のファイル本体をPCのゴミ箱へ移動します。よろしいですか？', en: 'Move these {count} original files to the computer’s trash?' },
  'grid.deleting': { ja: 'ゴミ箱へ移動中…', en: 'Moving to trash…' },
  'grid.deleteComplete': { ja: '{count}件のファイルをゴミ箱へ移動しました。', en: 'Moved {count} files to the trash.' },
  'grid.deleteNotFound': { ja: '登録データが見つかりません。', en: 'The photo record was not found.' },
  'grid.deleteFileFailed': { ja: 'ゴミ箱へ移動できませんでした。ファイルの有無・使用状況・アクセス権を確認してください。', en: 'Could not move to trash. Check that the file exists, is not in use, and is accessible.' },
  'grid.deleteFailed': { ja: '削除処理に失敗しました。一覧を再読み込みし、ファイルの状態を確認してください。', en: 'Deletion failed. Reload the gallery and check the files.' },

  // Sidebar
  'sidebar.folders': { ja: 'フォルダ', en: 'Folders' },
  'sidebar.searchPlaceholder': { ja: 'ファイル/フォルダを検索...', en: 'Search files/folders...' },
  'sidebar.searching': { ja: '検索中...', en: 'Searching...' },
  'sidebar.noResults': { ja: '結果なし', en: 'No results' },
  'sidebar.allPhotos': { ja: 'すべての写真', en: 'All Photos' },
  'sidebar.favorites': { ja: 'お気に入り', en: 'Favorites' },
  'sidebar.includeSubfolders': { ja: '配下フォルダの写真も表示', en: 'Include subfolders' },
  'sidebar.mediaFilter.all': { ja: 'すべて', en: 'All' },
  'sidebar.mediaFilter.photos': { ja: '写真のみ', en: 'Photos only' },
  'sidebar.mediaFilter.videos': { ja: '動画のみ', en: 'Videos only' },
  'sidebar.noFolders': { ja: 'スキャン済みフォルダなし', en: 'No folders scanned' },
  'sidebar.collapseAll': { ja: 'すべて閉じる', en: 'Collapse All' },

  // Viewer
  'viewer.prev': { ja: '前へ', en: 'Previous' },
  'viewer.next': { ja: '次へ', en: 'Next' },
  'viewer.random': { ja: 'ランダム', en: 'Random' },
  'viewer.fullscreen': { ja: '全画面表示', en: 'Fullscreen' },
  'viewer.exitFullscreen': { ja: '全画面解除', en: 'Exit Fullscreen' },
  'viewer.screenshot': { ja: 'スクリーンショットを保存', en: 'Save screenshot' },
  'viewer.screenshotSaved': { ja: 'スクリーンショットを保存しました', en: 'Screenshot saved' },
  'viewer.screenshotFailed': { ja: 'スクリーンショットの保存に失敗しました', en: 'Failed to save screenshot' },
  'viewer.screenshotNoFolder': { ja: '設定画面でスクリーンショットの保存先を設定してください', en: 'Please set the screenshot folder in Settings' },
  'viewer.randomPicks': { ja: '4枚ランダム表示', en: '4 Random Photos' },
  'viewer.saveCombination': { ja: '組み合わせをお気に入りに追加', en: 'Save combination to favorites' },
  'viewer.combinationSaved': { ja: 'お気に入りに保存しました', en: 'Saved to favorites' },
  'viewer.backToPhoto': { ja: '写真に戻る', en: 'Back to Photo' },
  'viewer.backToGallery': { ja: '戻る', en: 'Back to Gallery' },
  'viewer.copyPath': { ja: 'パスをコピー', en: 'Copy Path' },
  'viewer.copyPathSuccess': { ja: 'パスをコピーしました', en: 'Path copied' },
  'viewer.copyPathFailed': { ja: 'コピーに失敗しました', en: 'Failed to copy' },
  'viewer.openInExplorer': { ja: 'エクスプローラーで開く', en: 'Open in Explorer' },
  'viewer.layoutHorizontal': { ja: '横表示', en: 'Horizontal' },
  'viewer.layoutVertical': { ja: '縦表示', en: 'Vertical' },

  // Settings
  'settings.title': { ja: '設定', en: 'Settings' },
  'settings.photoFolder': { ja: '写真フォルダ', en: 'Photo Folder' },
  'settings.rootFolder': { ja: 'ルートフォルダ:', en: 'Root Folder Path:' },
  'settings.screenshotFolder': { ja: 'スクリーンショット保存先', en: 'Screenshot Folder' },
  'settings.screenshotFolderPath': { ja: '保存先フォルダ:', en: 'Save Folder Path:' },
  'settings.extensions': { ja: '拡張子:', en: 'File Extensions:' },
  'settings.save': { ja: '保存', en: 'Save Settings' },
  'settings.saved': { ja: '設定を保存しました', en: 'Settings saved successfully' },
  'settings.scan': { ja: 'スキャン', en: 'Scan Photos' },
  'settings.startScan': { ja: 'スキャン開始', en: 'Start Scan' },
  'settings.scanning': { ja: 'スキャン中...', en: 'Scanning...' },
  'settings.scanComplete': { ja: 'スキャン完了: {count}件処理しました', en: 'Scan complete: {count} files processed' },
  'settings.filesProcessed': { ja: '{processed} / {total} 件処理済み', en: '{processed} / {total} files processed' },
  'settings.scanInfo': { ja: 'スキャン済み: {count}件', en: 'Scanned: {count} photos' },
  'settings.scanFolder': { ja: 'フォルダ: {path}', en: 'Folder: {path}' },
  'settings.scanNoData': { ja: 'スキャン済みデータなし', en: 'No scanned data' },
  'settings.folderNotFound': { ja: '指定されたフォルダが見つかりません', en: 'The specified folder was not found' },
  'settings.folderSelect': { ja: 'スキャン対象フォルダ', en: 'Folders to Scan' },
  'settings.folderSelectDesc': { ja: 'スキャン・ギャラリーに含めるフォルダを選択してください。', en: 'Select folders to include in scan and gallery.' },
  'settings.saveSelection': { ja: '選択を保存', en: 'Save Selection' },
  'settings.selectAll': { ja: 'すべて選択', en: 'Select All' },
  'settings.deselectAll': { ja: 'すべて未選択', en: 'Deselect All' },
  'settings.browse': { ja: '選択', en: 'Browse' },
  'settings.langLabel': { ja: '表示言語:', en: 'Display Language:' },
  'settings.themeLabel': { ja: 'テーマ:', en: 'Theme:' },
  'settings.themeSystem': { ja: 'システム設定に合わせる', en: 'System' },
  'settings.themeDark': { ja: 'ダーク', en: 'Dark' },
  'settings.themeLight': { ja: 'ライト', en: 'Light' },
  'settings.resetData': { ja: 'データリセット', en: 'Reset Data' },
  'settings.resettingData': { ja: 'リセット中...', en: 'Resetting...' },
  'settings.resetDone': { ja: 'リセット完了', en: 'Reset complete' },
  'settings.resetConfirm': { ja: 'スキャンデータとサムネイルキャッシュを削除しますか？', en: 'Delete scan data and thumbnail cache?' },
  'settings.rescanSelected': { ja: '選択したフォルダのみを再スキャン', en: 'Rescan Selected Folders' },
  'settings.rescanning': { ja: '再スキャン中...', en: 'Rescanning...' },
  'settings.rescanComplete': { ja: '再スキャン完了: {count}件処理しました', en: 'Rescan complete: {count} files processed' },
  'settings.scanned': { ja: 'スキャン済み', en: 'Scanned' },
  'settings.deleteFolderData': { ja: 'このフォルダのスキャンデータを削除', en: "Delete this folder's scanned data" },
  'settings.deleteFolderHint': { ja: '各フォルダのゴミ箱アイコンを押すと、そのフォルダ内のスキャン済みデータのみを削除します（ディスク上のファイル本体は削除されません）。', en: 'Click a folder’s trash icon to remove only the scanned data within that folder (the actual files on disk are not deleted).' },
  'settings.deleteConfirm': { ja: '「{path}」内のスキャン済みデータを削除します。よろしいですか？（ファイル本体は削除されません）', en: 'Delete scanned data within "{path}"? (The actual files are not deleted.)' },
  'settings.deleteComplete': { ja: '{count}件のデータを削除しました', en: 'Deleted {count} items' },
  'settings.deleteProgress': { ja: '削除中: {processed} / {total}', en: 'Deleting: {processed} / {total}' },

  // Favorites (combinations)
  'favorites.title': { ja: 'お気に入り一覧', en: 'Favorite Combinations' },
  'favorites.empty': { ja: 'お気に入りの組み合わせはまだありません', en: 'No favorite combinations yet' },
  'favorites.view': { ja: '表示', en: 'View' },
  'favorites.delete': { ja: '削除', en: 'Delete' },
  'favorites.createdAt': { ja: '登録日時', en: 'Added on' },
  'favorites.deleteConfirm': { ja: 'この組み合わせを削除しますか？', en: 'Delete this combination?' },
} as const;

type TranslationKey = keyof typeof translations;

let currentLang: Lang = (localStorage.getItem('app_language') as Lang) || 'ja';
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem('app_language', lang);
  listeners.forEach((fn) => fn());
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const entry = translations[key];
  let text: string = entry?.[currentLang] ?? entry?.['en'] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
