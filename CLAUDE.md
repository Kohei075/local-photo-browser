# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ローカルフォルダの画像をスキャンし、サムネイル生成・ギャラリー表示・ビューア・お気に入り・タグ付け・フォルダナビゲーションを提供するWebアプリ。Windows向けだがクロスプラットフォーム対応。日本語/英語バイリンガル。

## 技術スタック

- **バックエンド:** Python 3.10+ / FastAPI / SQLAlchemy 2.0 (同期) / SQLite (WALモード) / Pillow
- **フロントエンド:** React 19 / TypeScript 5.7 (strict) / Vite 6 / Zustand 5 / React Router 7
- **テストスイート・リンター/フォーマッターは未導入**

## コマンド

```bash
# 開発モード (バックエンド :8000 + フロントエンド :5173、プロキシ付き)
py scripts/start.py --dev
# Windows の場合:
start-dev.bat

# フロントエンドのみ
cd frontend && npm run dev        # 開発サーバー :5173
cd frontend && npm run build      # 本番ビルド (tsc -b && vite build)

# バックエンドのみ
cd backend && python main.py      # uvicorn 127.0.0.1:8000

# 本番起動 (FastAPIからビルド済みフロントエンドを配信)
cd frontend && npm run build && cd .. && py scripts/start.py
```

## アーキテクチャ

### バックエンド (`backend/`)

`main.py` にFastAPIアプリ。全APIルートは `/api` プレフィックス配下。本番ではさらに `frontend/dist/` を配信しSPAフォールバック対応。

- **ルーター:** `photos`, `images`, `favorites`, `tags`, `scan`, `settings`, `folders` — 各 `routers/` 内
- **モデル:** SQLAlchemy ORM (`models/`) — `photos`, `person_tags`, `photo_persons` (中間テーブル), `settings` (キーバリュー)
- **サービス:** `scanner.py` (バックグラウンドフォルダスキャン、差分検出、100件ごとバッチコミット), `thumbnail.py` (オンデマンド生成、`data/thumbnails/` にキャッシュ), `exif.py`, `pathutil.py` (Windows `\\?\` ロングパス対応)
- **データ:** SQLite DB + サムネイルキャッシュは `backend/data/` に自動生成

スキャナーは `BackgroundTask` として実行。進捗はインメモリのdictで管理し、フロントエンドからポーリングで取得。

### フロントエンド (`frontend/src/`)

3つのルート: `/` (グリッド), `/viewer/:photoId` (単体ビューア), `/settings`

- **状態管理:** 単一のZustandストア (`stores/appStore.ts`) — 写真リスト、ページネーション、ソート/フィルター、スキャン状態、フォルダツリー
- **APIクライアント:** `api/client.ts` のfetchラッパー (型付きジェネリクス)。開発時はViteプロキシで `/api/*` → `:8000` に転送
- **カスタムフック:** `usePhotos` (取得+無限スクロール), `useSettings`, `useFavorite`, `useKeyboardNav`
- **i18n:** `i18n/` の軽量自作システム — `translations.ts` の辞書 + `useSyncExternalStore` フック。Contextプロバイダー不要
- **グリッド:** `IntersectionObserver` ベースの無限スクロール、ページサイズ50件

### 主要パターン

- `PhotoViewer` は `forwardRef` で親に `toggleFullscreen()` を公開
- フォルダサイドバーは再帰的な `FolderTreeItem` コンポーネントでツリー描画
- 設定はDBの `settings` テーブルにキーバリュー形式で保存（設定ファイルではない）
- サムネイルは初回リクエスト時に生成し、JPEG としてディスクにキャッシュ
- OSフォルダ選択ダイアログは `tkinter` を使いFastAPIエンドポイントから呼び出し
