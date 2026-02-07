# 設計書：ローカル写真ブラウザ Web アプリ

---

## 1. システム概要

ローカル PC 内の写真をブラウザで閲覧するための Web アプリケーション。
バックエンド（Python/FastAPI）とフロントエンド（React/TypeScript）で構成し、
すべての通信・データ保存を localhost 内で完結させる。

---

## 2. アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│                   ブラウザ (Frontend)                  │
│  React 19 + TypeScript + Vite + Zustand              │
│  http://localhost:5173 (dev) / localhost:8000 (prod)  │
└────────────────────┬─────────────────────────────────┘
                     │  REST API (/api/*)
                     ▼
┌──────────────────────────────────────────────────────┐
│                 ローカルサーバ (Backend)                │
│  FastAPI + Uvicorn                                   │
│  http://localhost:8000                               │
├──────────────┬───────────────┬────────────────────────┤
│  Scanner     │  Thumbnail    │  EXIF Extractor        │
│  Service     │  Service      │  Service               │
└──────┬───────┴───────┬───────┴────────────────────────┘
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────────┐
│  SQLite DB  │  │ サムネイルキャッシュ │
│  (data/)    │  │  (thumbnails/)   │
└─────────────┘  └─────────────────┘
       │
       ▼
┌─────────────────┐
│ ローカルファイル    │
│ (写真フォルダ)     │
└─────────────────┘
```

### 2.1 通信方式

| 通信経路 | プロトコル | 説明 |
|---------|----------|------|
| ブラウザ → サーバ | HTTP (REST) | JSON リクエスト/レスポンス |
| サーバ → ファイルシステム | OS API | 写真ファイル・サムネイルの読み書き |
| サーバ → SQLite | SQLAlchemy (async) | ORM 経由のデータ操作 |

### 2.2 開発時と本番時の構成

| 環境 | フロントエンド | バックエンド | 備考 |
|-----|-------------|-----------|------|
| 開発 | Vite Dev Server (:5173) | Uvicorn (:8000) | Vite が `/api` をプロキシ |
| 本番 | FastAPI の静的ファイル配信 | Uvicorn (:8000) | ビルド済み HTML/JS を配信 |

---

## 3. 技術スタック

### 3.1 バックエンド

| ライブラリ | バージョン | 用途 |
|-----------|----------|------|
| FastAPI | 0.115.6 | Web フレームワーク |
| Uvicorn | 0.34.0 | ASGI サーバ |
| SQLAlchemy | 2.0.36 | ORM |
| aiosqlite | 0.20.0 | 非同期 SQLite ドライバ |
| Pillow | 11.1.0 | 画像処理（サムネイル・EXIF） |
| python-multipart | 0.0.20 | フォームデータ解析 |

### 3.2 フロントエンド

| ライブラリ | バージョン | 用途 |
|-----------|----------|------|
| React | 19.0.0 | UI フレームワーク |
| TypeScript | 5.7.0 | 型安全な開発 |
| Vite | 6.0.0 | ビルドツール・開発サーバ |
| React Router DOM | 7.1.0 | クライアントサイドルーティング |
| Zustand | 5.0.0 | 状態管理 |

---

## 4. データベース設計

### 4.1 ER 図

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     photos      │       │  photo_persons   │       │  person_tags    │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)          │    ┌──│ id (PK)         │
│ file_path       │  └───>│ photo_id (FK)    │    │  │ name            │
│ file_name       │       │ person_tag_id(FK)│<───┘  │ created_at      │
│ extension       │       └──────────────────┘       └─────────────────┘
│ file_size       │
│ width           │       ┌──────────────────┐
│ height          │       │    settings      │
│ created_at      │       ├──────────────────┤
│ modified_at     │       │ key (PK)         │
│ taken_at        │       │ value            │
│ is_favorite     │       │ updated_at       │
│ thumbnail_path  │       └──────────────────┘
│ scanned_at      │
└─────────────────┘
```

### 4.2 テーブル定義

#### photos テーブル

| カラム | 型 | 制約 | 説明 |
|-------|-----|------|------|
| id | INTEGER | PK, AUTO | 写真 ID |
| file_path | TEXT | UNIQUE, NOT NULL | ファイルの絶対パス |
| file_name | TEXT | NOT NULL | ファイル名 |
| extension | TEXT | NOT NULL | 拡張子（小文字） |
| file_size | INTEGER | | ファイルサイズ（バイト） |
| width | INTEGER | | 画像幅（px） |
| height | INTEGER | | 画像高さ（px） |
| created_at | DATETIME | | ファイル作成日時 |
| modified_at | DATETIME | | ファイル更新日時 |
| taken_at | DATETIME | | EXIF 撮影日時 |
| is_favorite | BOOLEAN | DEFAULT FALSE | お気に入りフラグ |
| thumbnail_path | TEXT | | サムネイルパス |
| scanned_at | DATETIME | | スキャン日時 |

**インデックス:** file_path, is_favorite, created_at, modified_at, taken_at, file_name

#### person_tags テーブル

| カラム | 型 | 制約 | 説明 |
|-------|-----|------|------|
| id | INTEGER | PK, AUTO | タグ ID |
| name | TEXT | UNIQUE, NOT NULL | 人物名 |
| created_at | DATETIME | DEFAULT NOW | 作成日時 |

#### photo_persons テーブル（中間テーブル）

| カラム | 型 | 制約 | 説明 |
|-------|-----|------|------|
| id | INTEGER | PK, AUTO | レコード ID |
| photo_id | INTEGER | FK → photos.id | 写真 ID |
| person_tag_id | INTEGER | FK → person_tags.id | 人物タグ ID |

**制約:** UNIQUE(photo_id, person_tag_id), CASCADE DELETE

#### settings テーブル

| カラム | 型 | 制約 | 説明 |
|-------|-----|------|------|
| key | TEXT | PK | 設定キー |
| value | TEXT | | 設定値 |
| updated_at | DATETIME | | 更新日時 |

**デフォルト設定値:**

| キー | デフォルト値 | 説明 |
|-----|-----------|------|
| root_folder | (空) | 写真ルートフォルダ |
| extensions | jpg,jpeg,png,webp | 対象拡張子 |
| slideshow_interval | 5 | スライド間隔（秒） |
| thumbnail_size | 300 | サムネイル最大辺（px） |

---

## 5. API 設計

### 5.1 エンドポイント一覧

すべてのエンドポイントは `/api` プレフィックスを持つ。

#### 写真操作

| メソッド | パス | 説明 | 主なパラメータ |
|---------|------|------|-------------|
| GET | /api/photos | 写真一覧取得 | page, per_page, sort_by, sort_order, favorite_only, person_tag_id |
| GET | /api/photos/random | ランダム1枚取得 | favorite_only, person_tag_id |
| GET | /api/photos/{id} | 写真詳細取得 | - |
| GET | /api/photos/{id}/neighbors | 前後の写真取得 | sort_by, sort_order, favorite_only, person_tag_id |

#### 画像配信

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/images/{id}/full | フル解像度画像 |
| GET | /api/images/{id}/thumbnail | サムネイル画像（オンデマンド生成） |

#### お気に入り

| メソッド | パス | 説明 |
|---------|------|------|
| PUT | /api/photos/{id}/favorite | お気に入りトグル |

#### 人物タグ

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/tags | タグ一覧取得（写真数付き） |
| POST | /api/tags | タグ新規作成 |
| PUT | /api/tags/{id} | タグ名変更 |
| DELETE | /api/tags/{id} | タグ削除 |
| POST | /api/photos/{id}/tags | 写真にタグ付与 |
| DELETE | /api/photos/{id}/tags/{tag_id} | 写真からタグ削除 |

#### 設定

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/settings | 全設定取得 |
| PUT | /api/settings | 設定更新 |
| POST | /api/settings/clear-cache | サムネイルキャッシュ削除 |
| POST | /api/settings/reset-db | DB リセット |

#### スキャン

| メソッド | パス | 説明 |
|---------|------|------|
| POST | /api/scan | フォルダスキャン開始 |
| GET | /api/scan/status | スキャン進捗取得 |

### 5.2 ソートオプション

| sort_by 値 | 説明 |
|-----------|------|
| created_at | ファイル作成日 |
| modified_at | ファイル更新日 |
| taken_at | EXIF 撮影日（優先） |
| file_name | ファイル名 |
| random | ランダム（シャッフル） |

---

## 6. フロントエンド設計

### 6.1 画面構成・ルーティング

| パス | ページ | 説明 |
|-----|-------|------|
| / | GridPage | サムネイル一覧（グリッド表示） |
| /viewer/:photoId | ViewerPage | 1枚表示（ビューア） |
| /people | PeoplePage | 人物タグ一覧 |
| /settings | SettingsPage | アプリ設定 |

### 6.2 コンポーネント構造

```
App.tsx
├── Layout
│   └── Header（ナビゲーション）
│
├── GridPage
│   ├── FilterBar（人物フィルタ・お気に入りフィルタ）
│   ├── SortBar（ソート種類・順序切替）
│   └── PhotoGrid
│       └── PhotoCard（サムネイル表示）
│
├── ViewerPage
│   ├── PhotoViewer（画像表示・ズーム）
│   ├── NavigationControls（前へ/次へ）
│   ├── SlideshowControls（スライドショー操作）
│   ├── FavoriteButton（お気に入りトグル）
│   ├── TagManager（タグ追加/削除）
│   └── ZoomControls（拡大/縮小）
│
├── PeoplePage
│   ├── PersonList（タグ一覧）
│   └── PersonCard（個別タグ表示）
│
└── SettingsPage
    ├── FolderSetting（フォルダ選択）
    ├── ScanButton（スキャン実行・進捗表示）
    └── SlideshowSetting（スライド間隔設定）
```

### 6.3 状態管理（Zustand Store）

```typescript
AppStore {
  // 写真データ
  photos: Photo[]
  totalPhotos: number
  currentPage: number

  // フィルタ・ソート状態
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
  favoriteOnly: boolean
  selectedTagId: number | null

  // 設定
  settings: Settings

  // アクション
  fetchPhotos()
  setSort(sortBy, sortOrder)
  setFilter(favoriteOnly, tagId)
  updateSettings(settings)
}
```

### 6.4 キーボードショートカット（ViewerPage）

| キー | 操作 |
|-----|------|
| ← / ArrowLeft | 前の写真 |
| → / ArrowRight | 次の写真 |
| Space | スライドショー開始/停止 |
| Escape | グリッドに戻る |

---

## 7. バックエンドサービス設計

### 7.1 Scanner Service

フォルダスキャンの処理フロー:

```
1. 設定から root_folder と extensions を取得
2. root_folder を再帰的に走査
3. 対象拡張子のファイルを抽出
4. 各ファイルについて:
   a. 既存レコードがあればスキップ or 更新判定
   b. ファイルメタ情報取得（サイズ・日時）
   c. EXIF 情報取得（撮影日）
   d. 画像サイズ取得
   e. DB に INSERT / UPDATE
5. DB に存在するがディスクにないファイルを削除
6. 100件ごとにバッチコミット
7. スキャン状態をメモリ上で管理（進捗表示用）
```

### 7.2 Thumbnail Service

```
1. photo_id からサムネイルパスを決定
2. キャッシュ済みならそのまま返却
3. 未生成なら:
   a. 元画像を Pillow で読み込み
   b. thumbnail_size の正方形に収まるようリサイズ
   c. JPEG 形式で保存（品質 85）
   d. DB にサムネイルパスを記録
4. FileResponse で返却
```

### 7.3 EXIF Service

```
1. Pillow で画像を開く
2. EXIF データを取得
3. DateTimeOriginal → DateTime の優先順で撮影日を抽出
4. パース失敗時は None を返却
```

---

## 8. セキュリティ設計

| 項目 | 対策 |
|-----|------|
| ネットワーク | localhost (127.0.0.1) のみで待ち受け |
| CORS | 開発時は localhost:5173 のみ許可 |
| 外部通信 | 一切行わない（ライブラリ更新チェックも含む） |
| ファイルアクセス | スキャン対象フォルダ内のみ読み取り |
| 入力検証 | タグ名・設定値のバリデーション |
| SQL インジェクション | SQLAlchemy ORM による自動エスケープ |

---

## 9. パフォーマンス設計

| 項目 | 対策 |
|-----|------|
| サムネイル | オンデマンド生成 + ディスクキャッシュ |
| DB アクセス | 非同期ドライバ (aiosqlite) + WAL モード |
| インデックス | 頻繁にクエリされるカラムにインデックス |
| スキャン | 100件ごとのバッチコミット |
| ページネーション | デフォルト50件/ページ |
| フロントエンド | Vite によるコード分割・バンドル最適化 |

---

## 10. ディレクトリ構成

```
web-pic-browser/
├── backend/
│   ├── main.py              # FastAPI エントリーポイント
│   ├── config.py             # 設定・パス定義
│   ├── database.py           # DB 接続・セッション管理
│   ├── models/               # SQLAlchemy モデル
│   │   ├── photo.py
│   │   ├── person_tag.py
│   │   ├── photo_person.py
│   │   └── setting.py
│   ├── schemas/              # Pydantic スキーマ
│   │   ├── photo.py
│   │   ├── person_tag.py
│   │   └── setting.py
│   ├── routers/              # API ルーター
│   │   ├── photos.py
│   │   ├── images.py
│   │   ├── favorites.py
│   │   ├── tags.py
│   │   ├── scan.py
│   │   └── settings.py
│   ├── services/             # ビジネスロジック
│   │   ├── scanner.py
│   │   ├── thumbnail.py
│   │   └── exif.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React エントリーポイント
│   │   ├── App.tsx           # ルーティング定義
│   │   ├── api/client.ts     # API クライアント
│   │   ├── types/index.ts    # 型定義
│   │   ├── stores/appStore.ts # Zustand ストア
│   │   ├── hooks/            # カスタムフック
│   │   ├── pages/            # ページコンポーネント
│   │   └── components/       # UI コンポーネント
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── scripts/
│   └── start.py              # 起動スクリプト
├── requirements.md            # 要件定義書
├── design.md                  # 設計書（本ファイル）
├── implementation-plan.md     # 実装プラン
└── README.md
```
