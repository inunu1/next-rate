# 画面設計と権限マトリクス

## 画面一覧
- ダッシュボード (`/dashboard`) — 権限に応じたメニュー表示
- ユーザー管理 (`/user`) — `owner` / `admin` のユーザー管理
- プレイヤー管理 (`/players`) — `owner` / `admin` / `editer` のCRUD、`viewer` は参照のみ
- 対局結果管理 (`/results`) — `owner` / `admin` / `editer` のCRUD、`viewer` は参照のみ
- ログイン (`/login`)

## 権限マトリクス（概要）
- owner: 全画面で読み書き可能（団体切替UIあり）
- admin: 自団体に対する読み書き（団体切替なし）
- editer: 自団体に対する読み書き（ユーザー管理は不可）
- viewer: 自団体に対する読み取りのみ（編集・削除・登録ボタンを非表示）

## 主要コンポーネント
- `ManagementPanel` — 管理画面の共通レイアウト（検索／登録エリア）
- `DataGrid` — 行表示とアクションカラム
- `FormBar`, `Select`, `DateInput`, `Button` — 入力 UI
