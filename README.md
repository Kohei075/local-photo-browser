# Local Photo Browser

ローカル環境に保存されている写真を、ブラウザから閲覧するためのWebアプリです。
本アプリは localhost 上で動作し、外部サービスとの通信は一切行いません。

---

## 機能

- 指定フォルダ内の写真をグリッド表示（無限スクロール対応）
- 写真のランダム表示
- お気に入り登録・管理
- 人物タグによる分類・絞り込み
- タグ・お気に入り・フォルダによるフィルタリング
- 日付・ファイル名・ランダムによる並び替え
- 単体ビューワ（前後ナビゲーション・ズーム・キーボード操作）
- サムネイル自動生成・キャッシュ
- EXIF情報（撮影日時）の自動取得
- フォルダツリーによるブラウジング
- 多言語対応（i18n）
- 完全ローカル・オフライン動作

---

## 技術構成

### バックエンド
- **Python** + **FastAPI** + **Uvicorn**
- **SQLAlchemy**（非同期、aiosqlite）
- **SQLite**（WALモード）
- **Pillow**（サムネイル生成・画像処理）

### フロントエンド
- **React 19** + **TypeScript**
- **Vite 6**（ビルド・開発サーバ）
- **React Router DOM 7**（ルーティング）
- **Zustand 5**（状態管理）

### データベース
- SQLite（`backend/data/app.db` に自動作成）
- テーブル：photos, person_tags, photo_persons, settings

---

## 対応画像形式

- JPG / JPEG
- PNG
- WEBP

※設定画面から拡張子を追加可能

---

## 前提条件

- Python 3.10 以上
- Node.js 18 以上
- npm

---

## 起動方法

### 方法1: バッチファイルで起動（Windows）

```
start-dev.bat
```

依存パッケージのインストールからバックエンド・フロントエンドの起動までを自動で行います。

### 方法2: Python スクリプトで起動

**開発モード**（フロントエンド開発サーバ付き）:

```
py scripts/start.py --dev
```

**本番モード**（ビルド済みフロントエンドをバックエンドから配信）:

```
py scripts/start.py
```

### 方法3: 手動で起動

バックエンドとフロントエンドをそれぞれ起動します。

```bash
# バックエンド依存パッケージのインストール
pip install -r backend/requirements.txt

# バックエンド起動（ポート8000）
py backend/main.py

# フロントエンド依存パッケージのインストール（別ターミナル）
cd frontend
npm install

# フロントエンド開発サーバ起動（ポート5173）
npm run dev
```

### アクセスURL

| 用途 | URL |
|------|-----|
| フロントエンド（開発時） | http://localhost:5173 |
| バックエンドAPI | http://localhost:8000 |
| APIドキュメント（Swagger UI） | http://localhost:8000/docs |

---

## 使い方

1. アプリを起動する
2. ブラウザで http://localhost:5173 を開く
3. 設定画面でルートフォルダを指定する
4. スキャンを実行する
5. 写真の閲覧を開始する

---

## プロジェクト構成

```
web-pic-browser/
├── backend/
│   ├── main.py              # FastAPI アプリケーション
│   ├── config.py            # パス設定
│   ├── database.py          # DB接続・初期化
│   ├── requirements.txt     # Python依存パッケージ
│   ├── models/              # SQLAlchemy モデル
│   ├── schemas/             # Pydantic スキーマ
│   ├── routers/             # APIエンドポイント
│   ├── services/            # ビジネスロジック（スキャン・サムネイル・EXIF）
│   └── data/                # DB・サムネイルキャッシュ（自動生成）
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx          # ルーティング設定
│       ├── api/             # APIクライアント
│       ├── types/           # 型定義
│       ├── stores/          # Zustand ストア
│       ├── hooks/           # カスタムフック
│       ├── pages/           # ページコンポーネント
│       ├── components/      # UIコンポーネント
│       └── i18n/            # 多言語対応
├── scripts/
│   └── start.py             # 起動スクリプト
├── start-dev.bat            # Windows用起動バッチ
├── design.md                # 設計ドキュメント
└── implementation-plan.md   # 実装計画
```

---

## キーボードショートカット（ビューワ画面）

| キー | 操作 |
|------|------|
| ← | 前の写真 |
| → | 次の写真 |
| Space | スライドショー切り替え |
| Escape | グリッド画面に戻る |

---

## プライバシー

- すべてのデータはローカルに保存されます
- 外部ネットワーク通信は行いません
- アプリは `localhost` のみで動作します

---

## ライセンス

MIT License
