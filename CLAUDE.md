# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ローカルフォルダの画像・動画をスキャンし、サムネイル/ポスターフレーム生成・ギャラリー表示・ビューア（画像表示／動画再生）・お気に入り・タグ付け・フォルダナビゲーションを提供するWebアプリ。Windows向けだがクロスプラットフォーム対応。日本語/英語バイリンガル。

## 技術スタック

- **バックエンド:** Python 3.10+ / FastAPI / SQLAlchemy 2.0 (同期) / SQLite (WALモード) / Pillow / imageio-ffmpeg (動画のポスターフレーム生成・解像度/再生時間取得)
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

- **ルーター:** `photos`, `images` (画像/動画配信・サムネ・スクリーンショット保存), `favorites`, `tags`, `scan` (フルスキャン・部分再スキャン・フォルダ単位削除＋各進捗), `settings`, `folders` (ツリー＋スキャン済み判定) — 各 `routers/` 内
- **モデル:** SQLAlchemy ORM (`models/`) — `photos` (動画は `duration` 等を保持), `person_tags`, `photo_persons` (中間テーブル), `settings` (キーバリュー)
- **サービス:** `scanner.py` (バックグラウンドフォルダスキャン、差分検出、100件ごとバッチコミット), `thumbnail.py` (画像サムネのオンデマンド生成、`data/thumbnails/` にキャッシュ), `video.py` (ffmpeg=imageio-ffmpeg同梱バイナリでポスターフレーム生成・解像度/再生時間取得), `exif.py`, `pathutil.py` (Windows `\\?\` ロングパス対応)
- **データ:** SQLite DB + サムネイル/ポスターフレームのキャッシュは `backend/data/` に自動生成

スキャナーは `BackgroundTask` として実行。進捗はインメモリのdict (`scan_status`) で管理し、フロントエンドからポーリングで取得。フォルダ単位削除も同様に `BackgroundTask` + `delete_status` で進捗管理する。

### フロントエンド (`frontend/src/`)

3つのルート: `/` (グリッド), `/viewer/:photoId` (単体ビューア), `/settings`

- **状態管理:** 単一のZustandストア (`stores/appStore.ts`) — 写真リスト、ページネーション、ソート/フィルター、メディア種別フィルター (`mediaFilter`)、配下フォルダ表示 (`includeSubfolders`)、直前に開いた写真 (`lastViewedPhotoId`)、スキャン状態、フォルダツリー
- **APIクライアント:** `api/client.ts` のfetchラッパー (型付きジェネリクス)。開発時はViteプロキシで `/api/*` → `:8000` に転送
- **カスタムフック:** `usePhotos` (取得+無限スクロール), `useSettings`, `useFavorite`, `useKeyboardNav`, `useScreenshot` (全画面のスクリーンショット保存)
- **i18n:** `i18n/` の軽量自作システム — `translations.ts` の辞書 + `useSyncExternalStore` フック。Contextプロバイダー不要
- **グリッド:** `IntersectionObserver` ベースの無限スクロール、ページサイズ50件

### 主要パターン

- `PhotoViewer` は `forwardRef` で親に `toggleFullscreen()` を公開
- フォルダサイドバーは再帰的な `FolderTreeItem` コンポーネントでツリー描画
- 設定はDBの `settings` テーブルにキーバリュー形式で保存（設定ファイルではない）
- サムネイルは初回リクエスト時に生成し、JPEG としてディスクにキャッシュ
- OSフォルダ選択ダイアログは `tkinter` を使いFastAPIエンドポイントから呼び出し
- **動画対応:** 拡張子判定は `config.py` の `VIDEO_EXTENSIONS`（フロントは `utils/media.ts`）。動画は `<video>` で再生し、グリッド/ビューアにポスターフレームと再生時間を表示。`photos.duration` カラムは `init_db` の軽量マイグレーション（`PRAGMA table_info` + `ALTER TABLE`）で追加
- **スキャン対象拡張子:** `config.SUPPORTED_EXTENSIONS`（画像+動画）を信頼源とし、`init_db` で `settings.extensions` に同期（拡張子入力欄はUIから廃止済み）
- **メディア種別フィルター:** サイドバーのプルダウン（すべて/写真のみ/動画のみ）→ `media_type` クエリで `/photos`・`/photos/random`・`neighbors` を絞り込み
- **スクリーンショット:** 全画面ビューアのカメラボタンで、表示中のメディア要素を `utils/capture.ts` がcanvasに描画（UIやブラウザクロームは写り込まない／拡大時はコンテナ枠でクリップ）し、`POST /api/screenshot` でPNGを設定の `screenshot_folder` に保存
- **閲覧位置の復元:** 写真クリック時に `lastViewedPhotoId` を記録し、グリッド復帰時に `scrollIntoView` で復元
- **フォルダ単位のデータ削除:** `FolderSelectTree` の各フォルダ行のゴミ箱で `POST /api/scan/delete-folders`（`BackgroundTask`）を実行。正規化パス前方一致（SQL LIKEではない＝`_`の誤爆回避）で対象を特定し、Photoレコードと `data/thumbnails/` のキャッシュのみ削除（ファイル本体は残す）。チェック状態依存の一括削除は事故防止のため廃止
- **スキャン済み表示:** `/folders/browse` が各ノードに `scanned`（配下にPhotoがあるか）を付与し、ツリーにバッジ表示。バッジ＋ゴミ箱はスキャン済みフォルダにのみ表示
- **進捗バー:** スキャン (`scan_status`)・再スキャン・削除 (`delete_status`) は進捗をポーリングし、共通の `.scan-progress` UIで表示
