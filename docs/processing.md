# 共通処理ドキュメント

## 概要
本アプリで重要な共通処理（レート計算、認可ロジック、トランザクションの取り扱い）をまとめます。

## Elo 再計算フロー（calculate）
1. 対局結果登録時に `POST /api/private/result` が成功すると、`/api/private/calculate` を呼び出して関連プレイヤーのレートを再計算します。
2. 計算はトランザクション内で行い、結果テーブルとプレイヤーのレートを同一トランザクションにコミットすることを推奨します。
3. PostgreSQL 上で複雑なバルク更新を行う場合は UUID 型のキャスト（`::uuid`）やパフォーマンスに注意してください。

## 認可ロジック
- `authService.resolveTargetOrganizationId(session, paramOrgId)` を使用して実行対象の `organizationId` を決定します。
- `requireOwnerOrAdmin()` 等のミドルウェアでアクセス制御を行います。

## エラーハンドリング
- 外部 API 呼び出しや DB 操作は try/catch で包み、クライアント向けには意味のあるエラーメッセージを返す。
- トランザクション失敗時はロールバックし、再試行戦略をドキュメント化してください。
