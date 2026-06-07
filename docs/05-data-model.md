# データ設計

## このドキュメントの目的

このドキュメントでは、業務用チャットアプリMVPで使用するデータ構造を整理する。

`docs/04-requirements.md` で定義した機能要件を実現するために、Firebase Authentication と Firestore で管理するデータを明確にする。

## 使用するサービス

このMVPでは、以下の役割分担とする。

| サービス                | 役割                     |
| ----------------------- | ------------------------ |
| Firebase Authentication | ユーザー認証を管理する   |
| Firestore               | アプリ内データを管理する |

## データ設計の前提

MVPでは、以下の前提でデータを設計する。

- 1ユーザーは1つのテナントに所属する
- ユーザーは `admin` または `member` のどちらかの権限を持つ
- テナント配下にチャンネルを持つ
- チャンネル配下にメッセージを持つ
- 管理者ユーザーだけがチャンネルを作成できる
- 一般ユーザーはチャンネル閲覧とメッセージ投稿を行う
- 既存テナントへの参加は参加コードで行う

## コレクション構成

Firestore のコレクション構成は以下とする。

```text
users/{userId}

tenants/{tenantId}

tenants/{tenantId}/channels/{channelId}

tenants/{tenantId}/channels/{channelId}/messages/{messageId}
```

## users

`users` では、アプリ内で使用するユーザー情報を管理する。

Firebase Authentication の UID を、Firestore の `users/{userId}` のドキュメントIDとして使用する。

### パス

```text
users/{userId}
```

### フィールド

| フィールド名 | 型        | 必須 | 説明                           | 制約                                     |
| ------------ | --------- | ---- | ------------------------------ | ---------------------------------------- |
| id           | string    | 必須 | Firebase Authentication の UID | Firebase Authentication の UID と一致する |
| displayName  | string    | 必須 | アプリ上で表示するユーザー名   | 前後空白を除いた状態で1文字以上50文字以内 |
| email        | string    | 必須 | メールアドレス                 | 前後空白を除いた状態でメール形式であること。Firebase Authentication 上で一意であること |
| tenantId     | string    | 必須 | 所属テナントID                 | 所属する `tenants/{tenantId}` のIDと一致する |
| role         | string    | 必須 | ユーザー種別                   | `admin` または `member` のいずれか       |
| createdAt    | timestamp | 必須 | 作成日時                       | サーバー側で設定する                     |
| updatedAt    | timestamp | 必須 | 更新日時                       | サーバー側で設定する                     |

### role の値

| 値     | 意味           |
| ------ | -------------- |
| admin  | 管理者ユーザー |
| member | 一般ユーザー   |

### データ例

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

## tenants

`tenants` では、組織・チーム単位の情報を管理する。

MVPでは、1つのテナントを1つの組織として扱う。

### パス

```text
tenants/{tenantId}
```

### フィールド

| フィールド名 | 型        | 必須 | 説明                     | 制約                                      |
| ------------ | --------- | ---- | ------------------------ | ----------------------------------------- |
| id           | string    | 必須 | テナントID               | Firestore の `tenants/{tenantId}` のIDと一致する |
| name         | string    | 必須 | テナント名               | 前後空白を除いた状態で1文字以上50文字以内 |
| joinCode     | string    | 必須 | 既存テナント参加用コード | 6文字の英数字大文字。ただし誤読防止のため 0/O/I/1 は使用しない |
| createdBy    | string    | 必須 | 作成者ユーザーID         | テナント作成者の Firebase Authentication UID |
| createdAt    | timestamp | 必須 | 作成日時                 | サーバー側で設定する                      |
| updatedAt    | timestamp | 必須 | 更新日時                 | サーバー側で設定する                      |

### データ例

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

## channels

`channels` では、テナント内のチャンネル情報を管理する。

チャンネルは必ず特定のテナントに紐付くため、`tenants/{tenantId}/channels` 配下に配置する。

### パス

```text
tenants/{tenantId}/channels/{channelId}
```

### フィールド

| フィールド名 | 型        | 必須 | 説明             | 制約                                      |
| ------------ | --------- | ---- | ---------------- | ----------------------------------------- |
| id           | string    | 必須 | チャンネルID     | Firestore の `channels/{channelId}` のIDと一致する |
| tenantId     | string    | 必須 | 所属テナントID   | パス上の `tenants/{tenantId}` のIDと一致する |
| name         | string    | 必須 | チャンネル名     | 前後空白を除いた状態で1文字以上50文字以内。同一テナント内で重複しないこと。MVPでは画面側で検証する |
| description  | string    | 任意 | チャンネル説明   | 任意。前後空白を除いた状態で200文字以内   |
| createdBy    | string    | 必須 | 作成者ユーザーID | チャンネル作成者の Firebase Authentication UID |
| createdAt    | timestamp | 必須 | 作成日時         | Firestore Security Rules 上で `request.time` と一致する |
| updatedAt    | timestamp | 必須 | 更新日時         | Firestore Security Rules 上で `request.time` と一致する |

### データ例

```json
{
    "id": "channel-001",
    "tenantId": "tenant-001",
    "name": "general",
    "description": "全体連絡用チャンネル",
    "createdBy": "firebase-auth-uid-001",
    "createdAt": "serverTimestamp",
    "updatedAt": "serverTimestamp"
}
```

## messages

`messages` では、チャンネル内のメッセージを管理する。

メッセージは必ず特定のテナント・チャンネルに紐付くため、`tenants/{tenantId}/channels/{channelId}/messages` 配下に配置する。

### パス

```text
tenants/{tenantId}/channels/{channelId}/messages/{messageId}
```

### フィールド

| フィールド名 | 型        | 必須 | 説明             | 制約                                      |
| ------------ | --------- | ---- | ---------------- | ----------------------------------------- |
| id           | string    | 必須 | メッセージID     | Firestore の `messages/{messageId}` のIDと一致する |
| tenantId     | string    | 必須 | 所属テナントID   | パス上の `tenants/{tenantId}` のIDと一致する |
| channelId    | string    | 必須 | 所属チャンネルID | パス上の `channels/{channelId}` のIDと一致する |
| body         | string    | 必須 | メッセージ本文   | 前後空白を除いた状態で1文字以上1000文字以内 |
| senderId     | string    | 必須 | 投稿者ユーザーID | 投稿者の Firebase Authentication UID と一致する |
| senderName   | string    | 必須 | 投稿者名         | 投稿者の `users/{userId}.displayName` と一致する |
| createdAt    | timestamp | 必須 | 投稿日時         | Firestore Security Rules 上で `request.time` と一致する |

### データ例

```json
{
    "id": "message-001",
    "tenantId": "tenant-001",
    "channelId": "channel-001",
    "body": "本日の進捗を共有します。",
    "senderId": "firebase-auth-uid-002",
    "senderName": "佐藤花子",
    "createdAt": "serverTimestamp"
}
```

## データの関係

このMVPのデータ関係は以下とする。

```text
User
  └─ belongs to Tenant

Tenant
  └─ has many Channels

Channel
  └─ has many Messages

Message
  └─ belongs to User
```

| データ             | 関係        | 説明                             |
| ------------------ | ----------- | -------------------------------- |
| users.tenantId     | tenants.id  | ユーザーが所属するテナント       |
| channels.tenantId  | tenants.id  | チャンネルが所属するテナント     |
| messages.tenantId  | tenants.id  | メッセージが所属するテナント     |
| messages.channelId | channels.id | メッセージが投稿されたチャンネル |
| messages.senderId  | users.id    | メッセージ投稿者                 |

## ユーザー登録時のデータ作成

Phase 3 の要件・設計再確認により、登録時のデータ作成は Next.js Route Handler と Firebase Admin SDK で行う方針とする。

理由は、参加コード検索、`role` の決定、`tenantId` の紐付けをクライアント側の自己申告に依存させないためである。

通常のチャンネル取得、チャンネル作成、メッセージ投稿などは Firebase Client SDK と Firestore Security Rules で制御する。
一方で、ユーザー登録時の以下の処理は権限の根拠を作る処理であるため、サーバー側に集約する。

- Firebase Authentication ユーザーの作成
- 新規テナント作成
- 参加コードによるテナント検索
- `users/{userId}` の作成
- `admin` / `member` の決定
- ユーザーとテナントの紐付け

### 新規テナントを作成する場合

新規テナントを作成してユーザー登録する場合、以下のデータを作成する。

1. ブラウザから Next.js Route Handler にユーザー名、メールアドレス、パスワード、テナント名を送信する
2. Route Handler で入力値を検証する
3. Firebase Admin SDK で Firebase Authentication にユーザーを作成する
4. Route Handler で `tenants/{tenantId}` を作成する
5. Route Handler で `users/{userId}` を作成する

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

## 既存テナント参加時のデータ作成

参加コードを使って既存テナントに参加する場合、以下のデータを作成する。

1. ブラウザから Next.js Route Handler にユーザー名、メールアドレス、パスワード、参加コードを送信する
2. Route Handler で入力値を検証する
3. Route Handler が Firebase Admin SDK で参加コードに一致するテナントを検索する
4. Firebase Admin SDK で Firebase Authentication にユーザーを作成する
5. Route Handler で `users/{userId}` を作成する

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

## チャンネル作成時のデータ作成

管理者ユーザーがチャンネルを作成する場合、以下のデータを作成する。

```text
tenants/{tenantId}/channels/{channelId}
```

チャンネル作成時には、以下を確認する。

- ログイン済みユーザーであること
- ユーザーが対象テナントに所属していること
- ユーザーの `role` が `admin` であること
- 同一テナント内に同じチャンネル名が存在しないこと

## メッセージ投稿時のデータ作成

ユーザーがメッセージを投稿する場合、以下のデータを作成する。

```text
tenants/{tenantId}/channels/{channelId}/messages/{messageId}
```

メッセージ投稿時には、以下を確認する。

- ログイン済みユーザーであること
- ユーザーが対象テナントに所属していること
- 対象チャンネルが所属テナント内に存在すること
- メッセージ本文が空ではないこと

## クエリ設計

MVPで想定する主なクエリは以下とする。

### ログインユーザー情報取得

```text
users/{userId}
```

Firebase Authentication の UID を使って、アプリ内ユーザー情報を取得する。

### 所属テナント情報取得

```text
tenants/{tenantId}
```

`users/{userId}` に保存されている `tenantId` を使って、所属テナント情報を取得する。

### 参加コードによるテナント検索

```text
tenants where joinCode == 入力された参加コード
```

ユーザー登録時に、入力された参加コードに一致するテナントを検索する。

### チャンネル一覧取得

```text
tenants/{tenantId}/channels
```

所属テナント配下のチャンネル一覧を取得する。

### メッセージ一覧取得

```text
tenants/{tenantId}/channels/{channelId}/messages
```

対象チャンネル配下のメッセージ一覧を取得する。

メッセージは `createdAt` の昇順で表示する。

## Firestore Security Rules で制御すること

MVPでは、Firestore Security Rules により以下を制御する。

- ログインしていないユーザーはデータを読み書きできない
- ユーザーは自分の `users/{userId}` を参照できる
- ユーザーは自分が所属するテナントの情報だけを参照できる
- ユーザーは所属テナント内のチャンネルだけを参照できる
- ユーザーは所属テナント内のメッセージだけを参照できる
- 管理者ユーザーだけがチャンネルを作成できる
- ユーザーは所属テナント内のチャンネルにだけメッセージを投稿できる
- ユーザーは他テナントのチャンネルやメッセージを参照できない

## 参加コードの扱い

MVPでは、既存テナント参加のために `joinCode` を使用する。

参加コードの扱いは以下とする。

- テナント作成時に参加コードを生成する
- 一般ユーザーは参加コードを入力してテナントに参加する
- 参加コードは管理者ユーザーのみに表示する
- 招待メール送信や承認フローは実装しない

## MVPでは扱わないデータ

初期MVPでは、以下のデータは扱わない。

- ファイル情報
- 添付画像情報
- 既読情報
- 通知情報
- メンション情報
- リアクション情報
- スレッド返信情報
- ダイレクトメッセージ情報
- 監査ログ
- 詳細な権限情報
- 複数テナント所属情報
- チャンネルごとの権限情報

## 将来的な拡張候補

将来的に機能を拡張する場合は、以下のようなデータ追加を検討する。

### 複数テナント所属

```text
tenants/{tenantId}/members/{userId}
```

または

```text
tenantMembers/{tenantMemberId}
```

複数テナント所属を扱う場合は、ユーザーとテナントの関係を独立したデータとして管理する。

### チャンネルごとの権限

```text
tenants/{tenantId}/channels/{channelId}/members/{userId}
```

チャンネル単位で閲覧・投稿権限を制御する場合に使用する。

### 既読管理

```text
tenants/{tenantId}/channels/{channelId}/readStates/{userId}
```

ユーザーごとの既読位置を管理する場合に使用する。

## 完了条件

このデータ設計は、以下を満たす状態で完了とする。

- ユーザー情報を管理できる
- テナント情報を管理できる
- チャンネル情報をテナント単位で管理できる
- メッセージ情報をチャンネル単位で管理できる
- 参加コードで既存テナントに参加できる
- ログインユーザーが所属テナントのデータだけを参照できる
- 管理者ユーザーだけがチャンネルを作成できる
- 将来的な拡張候補を説明できる
