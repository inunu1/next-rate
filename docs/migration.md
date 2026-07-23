# DB / マイグレーション注意事項

## Prisma enum と Postgres の不整合 (例)
本リポジトリでは `Role` enum に `editer` を追加しています。既存データベースに新しい enum 値が無い場合、ランタイムで次のようなエラーが発生します:

```
invalid input value for enum "Role": "editer"
```

## 対処方法（選択肢）
1. Prisma マイグレーションを作成・適用

```bash
npx prisma migrate dev --name add-editer-to-role
npx prisma migrate deploy   # 本番での適用
```

2. 既存本番 DB へ直接 SQL を実行（ダウンタイムや影響範囲を確認の上）

```sql
ALTER TYPE "Role" ADD VALUE 'editer';
```

注意: Postgres の enum 追加は既存値に影響しませんが、ロールバックが困難です。ステージングで検証してから本番適用してください。
