# 起動時の依存関係チェック

`start-dev.bat` は、バッチファイルのあるフォルダを基準に
`py scripts/start.py --dev` を実行します。

Python とフロントエンドの依存関係は初回起動時にインストールします。
以後は記録した状態を確認し、変更がなければインストールを省略します。

- Python: requirements.txt、Python 実行環境、対象パッケージのインストール済みバージョン
- フロントエンド: package.json、package-lock.json、Node.js 実行環境、Vite の存在

インストールに失敗した場合は成功状態を記録せず、起動を中断します。
記録ファイルは Git 管理対象外の backend/data/ と frontend/node_modules/ に置きます。

依存関係を修復・再インストールする場合:

```powershell
py scripts/start.py --setup-only
```

通常の開発起動は `py scripts/start.py --dev` です。
本番起動は従来どおり、`frontend` で `npm run build` を実行後、
リポジトリのルートで `py scripts/start.py` を実行します。
