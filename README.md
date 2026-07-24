# next-rate

next-rate は、団体向けの対局結果管理アプリです。プレイヤーごとのレーティングと試合結果を記録し、日付単位で検索・管理できます。

## 目次

- [概要](#概要)
- [環境構築](#環境構築)
- [環境変数](#環境変数)
- [データベース](#データベース)
- [開発](#開発)
- [本番運用](#本番運用)
- [主な機能](#主な機能)
- [注意点](#注意点)

## 概要

- フロントエンド: Next.js App Router
- API: Next.js ルートハンドラー
- ORM: Prisma
- 認証: NextAuth（Credentials）
- DB: PostgreSQL / Neon など

## 環境構築

### 1. 依存関係インストール

```bash
pnpm install
```

### 2. 環境変数を準備

ルートに `.env` を作成し、以下の値を設定します。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_SECRET=your-secret-value
```

#### 主要な環境変数

- `DATABASE_URL`: Prisma が接続する PostgreSQL の接続先
- `NEXTAUTH_SECRET`: NextAuth の JWT シークレット

> `.env` は Git に含めないでください。

### 3. Prisma クライアント生成

```bash
pnpm prisma generate
```

### 4. データベースマイグレーション

既存のマイグレーションを適用する場合:

```bash
pnpm prisma migrate deploy
```

開発中にスキーマ変更を行う場合:

```bash
pnpm prisma migrate dev --name init
```

## データベース

`prisma/schema.prisma` には以下のモデルがあります。

- `Organization` - 団体を表すエンティティ
- `User` - 認証ユーザー（owner/admin/admin の団体ユーザー）
- `Player` - 団体に紐づくプレイヤー
- `Result` - 対局結果とレート情報

`Result` は `organizationId`, `matchDate`, `roundIndex`, `winnerId/loserId` の組み合わせでユニーク性を持つ設計です。

## 開発

## ドキュメント

- API 仕様: [docs/API.md](docs/API.md)
- 共通処理: [docs/processing.md](docs/processing.md)
- 画面設計: [docs/screens.md](docs/screens.md)
- DB マイグレーション注意: [docs/migration.md](docs/migration.md)

開発サーバーを起動します。

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` を開いて確認します。

## テスト

テストは Vitest で実行します。

- `pnpm test` - すべてのテストを実行
- `pnpm test:watch` - 変更を監視しながらテストを実行

現状のテストは以下の通りです。

- `src/lib/userService.test.ts`
  - `getAllUsers` の `owner` / `admin` の動作検証
  - `createUser` の入力バリデーションと重複チェック
  - `deleteUser` の ID 必須チェック

追加のテストシナリオとしては、API ルートの認可、`viewer` の閲覧専用UI、`results` / `players` のフロントエンド挙動などが想定されます。

## 本番運用

本番ビルドを作成します。

```bash
pnpm build
```

本番サーバーを起動します。

```bash
pnpm start
```

## 主な機能

- ログイン / 認証管理
- 対局結果の登録・検索
- プレイヤー管理
- ユーザー管理（owner/admin）
- ページ単位の認可制御
- API への認証付きアクセス

## ロールとアクセス

- `owner`
  - SaaS 管理者
  - 団体管理、ユーザー管理、対局者管理、対局結果管理が可能
  - 全団体のユーザー・プレイヤー・結果を閲覧・編集できる
- `admin`
  - 団体オーナー
  - 自団体のユーザー管理（`editer` / `viewer` の追加・削除）
  - 自団体の対局者管理、対局結果管理が可能
  - 団体管理画面へのアクセスは不可
- `editer`
  - 自団体の対局者管理・対局結果管理が可能
  - ユーザー管理・団体管理は不可
- `viewer`
  - 自団体の対局者一覧・対局結果一覧を閲覧可能
  - 登録・削除などの編集操作は不可

## 現状の設計・挙動

- `owner` は複数団体を横断できる
- `admin` は自団体内のみ操作可能
- `viewer` はダッシュボードから対局者/対局結果画面に遷移でき、一覧を閲覧できる
- `players` / `results` の絞り込みは `Organization` 名で行う
- `User` 管理画面は `owner` / `admin` に表示されるが、`admin` は自団体のみ管理できる

## ロール別アクセスマトリクス

| REST リソース / 行動 | owner | admin | editer | viewer |
| --- | --- | --- | --- | --- |
| GET `/api/private/user` | 全ユーザー | 自団体のみ | × | × |
| POST `/api/private/user` | 全ユーザー（任意組織） | 自団体のみ（`editer` / `viewer` 登録可） | × | × |
| DELETE `/api/private/user` | 全ユーザー | 自団体のみ | × | × |
| GET `/api/private/player` | 全団体 | 自団体 | 自団体 | × |
| POST `/api/private/player` | 全団体 | 自団体 | 自団体 | × |
| DELETE `/api/private/player` | 全団体 | 自団体 | 自団体 | × |
| GET `/api/private/result` | 全団体 | 自団体 | 自団体 | × |
| POST `/api/private/result` | 全団体 | 自団体 | 自団体 | × |
| DELETE `/api/private/result` | 全団体 | 自団体 | 自団体 | × |
| POST `/api/private/calculate` | 全団体 | 自団体 | 自団体 | × |
| GET `/user` ページ | 全団体ユーザー一覧 | 自団体ユーザー一覧 | × | × |
| GET `/players` ページ | 全団体プレイヤー | 自団体プレイヤー | 自団体プレイヤー | 自団体プレイヤー（閲覧のみ） |
| GET `/results` ページ | 全団体結果 | 自団体結果 | 自団体結果 | 自団体結果（閲覧のみ） |
| GET `/organization` ページ | 団体管理 | × | × | × |

### 補足
- `owner` は全団体を横断して閲覧・作成・削除が可能
- `admin` は自団体に限定される。`/user` では `editer` / `viewer` の追加・削除が可能
- `editer` は自団体の `player` / `result` を編集できるが、ユーザー管理・団体管理は不可
- `viewer` は自団体の一覧を閲覧できるが、登録・更新・削除はできない

## 注意点

- 現在、`.env.example` は用意されていません。`.env` を手動で作成してください。
- `src/lib/resultService.ts` には `prisma.$queryRawUnsafe()` が含まれており、入力検証と SQL 安全性の強化が必要です。
- 本番環境では `NEXTAUTH_SECRET` と `DATABASE_URL` を安全に管理し、Git へ漏洩しないようにしてください。
- 追加テスト・監視・ログ集約は現状で未整備です。

## スクリプト

- `pnpm dev` - 開発サーバー起動
- `pnpm build` - 本番ビルド
- `pnpm start` - 本番サーバー起動
- `pnpm lint` - ESLint 実行
