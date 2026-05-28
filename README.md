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
npm install
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
npx prisma generate
```

### 4. データベースマイグレーション

既存のマイグレーションを適用する場合:

```bash
npx prisma migrate deploy
```

開発中にスキーマ変更を行う場合:

```bash
npx prisma migrate dev --name init
```

## データベース

`prisma/schema.prisma` には以下のモデルがあります。

- `User` - 認証ユーザー（owner/admin）
- `Player` - 団体に紐づくプレイヤー
- `Result` - 対局結果とレート情報

`Result` は `userId`, `matchDate`, `roundIndex` の組み合わせでユニーク性を持つ設計です。

## 開発

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いて確認します。

## 本番運用

本番ビルドを作成します。

```bash
npm run build
```

本番サーバーを起動します。

```bash
npm start
```

## 主な機能

- ログイン / 認証管理
- 対局結果の登録・検索
- プレイヤー管理
- ページ単位の認可制御（owner/admin）
- API への認証付きアクセス

## 注意点

- 現在、`.env.example` は用意されていません。`.env` を手動で作成してください。
- `src/lib/resultService.ts` には `prisma.$queryRawUnsafe()` が含まれており、入力検証と SQL 安全性の強化が必要です。
- 本番環境では `NEXTAUTH_SECRET` と `DATABASE_URL` を安全に管理し、Git へ漏洩しないようにしてください。
- 追加テスト・監視・ログ集約は現状で未整備です。

## スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番ビルド
- `npm start` - 本番サーバー起動
- `npm run lint` - ESLint 実行
