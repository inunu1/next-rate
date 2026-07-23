# API仕様書

## 概要
このドキュメントは本アプリケーションの公開・非公開 API 仕様と認可ルールをまとめたものです。

## エンドポイント一覧（抜粋）
- `GET /api/private/user` — ユーザー一覧（owner/admin）
- `POST /api/private/user` — ユーザー作成（owner/admin）
- `DELETE /api/private/user` — ユーザー削除（owner/admin）
- `GET /api/private/player` — プレイヤー一覧（owner/admin/editer/viewer）
- `POST /api/private/player` — プレイヤー作成（owner/admin/editer）
- `DELETE /api/private/player` — プレイヤー削除（owner/admin/editer）
- `GET /api/private/result` — 対局結果一覧（owner/admin/editer/viewer）
- `POST /api/private/result` — 対局結果登録（owner/admin/editer）
- `DELETE /api/private/result` — 対局結果削除（owner/admin/editer）
- `POST /api/private/calculate` — レート再計算（内部、登録後に呼ばれる）

## 認可ルール（サマリ）
- `owner`: 全団体に対する読み書き（団体選択 UI が有効）
- `admin`: 自団体のみ読み書き
- `editer`: 自団体のみ読み書き（プレイヤー/結果の編集）
- `viewer`: 自団体のみ読み取り

## サンプル: 対局結果登録
POST /api/private/result

Request body (JSON):
{
  "winnerId": "uuid",
  "loserId": "uuid",
  "matchDate": "20240101",
  "roundIndex": 1,
  "userId": "organizationId" // owner は明示的に指定可能
}

Response (201 Created):
{
  "id": "uuid",
  "winnerId": "...",
  "loserId": "...",
  "matchDate": "20240101",
  "roundIndex": 1
}

詳しいリクエスト/レスポンスやエラーペイロードは今後拡張してください。
