# データ処理フロー

## このドキュメントの目的

このドキュメントでは、業務用チャットアプリMVPにおける主要なデータ作成・更新フローを整理する。

Firestore のコレクション構成、ドキュメント構造、主要フィールド、参照関係は `docs/05-data-model.md` に整理する。
技術選定と Firebase Admin SDK の扱いは `docs/07-tech-stack.md` に整理する。

## 処理フローの分類

`docs/05-data-model.md` から、データ構造そのものではなく処理手順・実装方針に該当する内容をこのドキュメントへ移す。

| 分類                         | 主な内容                                                                                 | 記載場所                 |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| データモデルとして残す内容   | コレクション構成、ドキュメント構造、主要フィールド、`tenantId` / `role`、参照関係        | `docs/05-data-model.md`  |
| 処理フローとして扱う内容     | 新規テナント作成、既存テナント参加、チャンネル作成、メッセージ投稿の手順                 | このドキュメント         |
| 実装方針として扱う内容       | 登録・参加処理を Route Handler と Firebase Admin SDK に集約する理由、Rules との責務分担 | このドキュメントと `docs/07-tech-stack.md` |

## 基本方針

Phase 3 の要件・設計再確認により、登録・参加処理は Next.js Route Handler と Firebase Admin SDK で行う方針とする。

理由は、参加コード検索、`role` の決定、`tenantId` の紐付けをクライアント側の自己申告に依存させないためである。

通常のチャンネル取得、チャンネル作成、メッセージ投稿などは Firebase Client SDK と Firestore Security Rules で制御する。
一方で、ユーザー登録時の以下の処理は権限の根拠を作る処理であるため、サーバー側に集約する。

- Firebase Authentication ユーザーの作成
- 新規テナント作成
- 参加コードによるテナント検索
- `users/{userId}` の作成
- `admin` / `member` の決定
- ユーザーとテナントの紐付け

## 新規テナント作成による登録

新規テナントを作成してユーザー登録する場合、以下のデータを作成する。

- Firebase Authentication ユーザー
- `tenants/{tenantId}`
- `users/{userId}`

処理手順は以下とする。

1. ブラウザから Next.js Route Handler にユーザー名、メールアドレス、パスワード、テナント名を送信する
2. Route Handler で入力値を検証する
3. Firebase Admin SDK で Firebase Authentication にユーザーを作成する
4. Route Handler で `tenants/{tenantId}` を作成する
5. Route Handler で `users/{userId}` を作成する
6. 登録成功後、ブラウザ側でメールアドレスとパスワードを使ってログインする

この場合、ユーザーの `role` は Route Handler 側で `admin` に固定する。
`tenantId`、`joinCode`、`createdBy` もクライアントから受け取らず、Route Handler 側で決定する。

### 作成する users の例

```json
{
  "id": "firebase-auth-uid-001",
  "displayName": "山田太郎",
  "email": "yamada@example.com",
  "tenantId": "tenant-001",
  "role": "admin",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### 作成する tenants の例

```json
{
  "id": "tenant-001",
  "name": "サンプル開発チーム",
  "joinCode": "ABC123",
  "createdBy": "firebase-auth-uid-001",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

## 既存テナント参加による登録

参加コードを使って既存テナントに参加する場合、以下のデータを作成する。

- Firebase Authentication ユーザー
- `users/{userId}`

処理手順は以下とする。

1. ブラウザから Next.js Route Handler にユーザー名、メールアドレス、パスワード、参加コードを送信する
2. Route Handler で入力値を検証する
3. Route Handler が Firebase Admin SDK で参加コードに一致するテナントを検索する
4. Firebase Admin SDK で Firebase Authentication にユーザーを作成する
5. Route Handler で `users/{userId}` を作成する
6. 登録成功後、ブラウザ側でメールアドレスとパスワードを使ってログインする

この場合、ユーザーの `role` は Route Handler 側で `member` に固定する。
`tenantId` は参加コード検索で見つかったテナントから決定し、クライアントからは受け取らない。

### 作成する users の例

```json
{
  "id": "firebase-auth-uid-002",
  "displayName": "佐藤花子",
  "email": "sato@example.com",
  "tenantId": "tenant-001",
  "role": "member",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

## チャンネル作成

管理者ユーザーがチャンネルを作成する場合、以下のデータを作成する。

```text
tenants/{tenantId}/channels/{channelId}
```

チャンネル作成時には、以下を確認する。

- ログイン済みユーザーであること
- ユーザーが対象テナントに所属していること
- ユーザーの `role` が `admin` であること
- 同一テナント内に同じチャンネル名が存在しないこと

`tenantId` はパス上の `tenants/{tenantId}` とドキュメント内の `tenantId` を一致させる。
これにより、別テナント配下のチャンネルとして不正に作成されることを防ぐ。

## メッセージ投稿

ユーザーがメッセージを投稿する場合、以下のデータを作成する。

```text
tenants/{tenantId}/channels/{channelId}/messages/{messageId}
```

メッセージ投稿時には、以下を確認する。

- ログイン済みユーザーであること
- ユーザーが対象テナントに所属していること
- 対象チャンネルが所属テナント内に存在すること
- メッセージ本文が空ではないこと
- `senderId` が Firebase Authentication の UID と一致すること

`tenantId` と `channelId` は、パス上の値とドキュメント内の値を一致させる。
`senderName` は投稿時点のユーザー表示名を保存し、メッセージ一覧表示でユーザー名を表示するために使用する。

## Firestore Security Rules との責務分担

登録・参加処理は Route Handler と Firebase Admin SDK が担当するため、クライアントから `users/{userId}` や `tenants/{tenantId}` を直接作成しない。

Firestore Security Rules は、主にログイン後の通常操作を制御する。

- ログインしていないユーザーはデータを読み書きできない
- ユーザーは自分の `users/{userId}` を参照できる
- ユーザーは自分が所属するテナントの情報だけを参照できる
- ユーザーは所属テナント内のチャンネルだけを参照できる
- ユーザーは所属テナント内のメッセージだけを参照できる
- 管理者ユーザーだけがチャンネルを作成できる
- ユーザーは所属テナント内のチャンネルにだけメッセージを投稿できる
- ユーザーは他テナントのチャンネルやメッセージを参照できない

## 失敗時の扱い

登録・参加処理では、Firebase Authentication と Firestore の複数データを作成する。
そのため、途中で失敗した場合は作成済みデータの後始末を試みる。

主な対象は以下とする。

- Firebase Authentication ユーザーだけが作成された場合は削除を試みる
- 新規テナント作成中に `users/{userId}` の作成へ失敗した場合は、作成済みのテナント削除を試みる
- 後始末に失敗した場合でも、ブラウザには登録失敗として扱えるエラーを返す

この方針により、認証情報と Firestore 上のアプリ用ユーザー情報が大きくずれた状態を残しにくくする。
