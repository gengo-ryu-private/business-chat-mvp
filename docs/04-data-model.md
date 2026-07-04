# データ設計

## 目的

機能要件を実現するため、Firestoreで管理するデータの構造、制約、関係を定義する。

Firebase AuthenticationのUIDをアプリ内ユーザーのIDとして使用する。データを作成する手順は `docs/05-data-flow.md` に整理する。

入力値の条件は `docs/03-requirements.md` を正とする。各表の「必須」は、Firestoreドキュメントに保存するフィールドとして必須であることを示す。

## 前提

- 1ユーザーは1つのテナントに所属する
- ユーザー種別は `admin` または `member` とする
- チャンネルはテナント配下、メッセージはチャンネル配下に配置する
- 権限制御には `tenantId`、`role`、Firebase AuthenticationのUIDを使用する

## コレクション構成

```text
users/{userId}
tenants/{tenantId}
tenants/{tenantId}/channels/{channelId}
tenants/{tenantId}/channels/{channelId}/messages/{messageId}
```

## users

パス: `users/{userId}`

| フィールド  | 型        | 必須 | 内容           | 制約                               |
| ----------- | --------- | ---- | -------------- | ---------------------------------- |
| id          | string    | 必須 | ユーザーID     | Firebase AuthenticationのUIDと一致 |
| displayName | string    | 必須 | 表示名         | -                                  |
| email       | string    | 必須 | メールアドレス | -                                  |
| tenantId    | string    | 必須 | 所属テナントID | `tenants/{tenantId}`のIDと一致     |
| role        | string    | 必須 | ユーザー種別   | `admin`または`member`              |
| createdAt   | timestamp | 必須 | 作成日時       | サーバー側で設定                   |
| updatedAt   | timestamp | 必須 | 更新日時       | サーバー側で設定                   |

## tenants

パス: `tenants/{tenantId}`

| フィールド | 型        | 必須 | 内容       | 制約                                |
| ---------- | --------- | ---- | ---------- | ----------------------------------- |
| id         | string    | 必須 | テナントID | ドキュメントIDと一致                |
| name       | string    | 必須 | テナント名 | -                                   |
| createdBy  | string    | 必須 | 作成者ID   | 作成者のFirebase Authentication UID |
| createdAt  | timestamp | 必須 | 作成日時   | サーバー側で設定                    |
| updatedAt  | timestamp | 必須 | 更新日時   | サーバー側で設定                    |

## tenantSecrets

パス: `tenantSecrets/{tenantId}`

| フィールド | 型        | 必須 | 内容       | 制約                        |
| ---------- | --------- | ---- | ---------- | --------------------------- |
| tenantId   | string    | 必須 | テナントID | ドキュメントIDと一致        |
| joinCode   | string    | 必須 | 参加コード | adminのみクライアント参照可 |
| createdAt  | timestamp | 必須 | 作成日時   | サーバー側で設定            |
| updatedAt  | timestamp | 必須 | 更新日時   | サーバー側で設定            |

## channels

パス: `tenants/{tenantId}/channels/{channelId}`

| フィールド  | 型        | 必須 | 内容             | 制約                                |
| ----------- | --------- | ---- | ---------------- | ----------------------------------- |
| id          | string    | 必須 | チャンネルID     | ドキュメントIDと一致                |
| tenantId    | string    | 必須 | 所属テナントID   | パス上の`tenantId`と一致            |
| name        | string    | 必須 | チャンネル名     | -                                   |
| description | string    | 任意 | チャンネルの説明 | -                                   |
| createdBy   | string    | 必須 | 作成者ID         | 作成者のFirebase Authentication UID |
| createdAt   | timestamp | 必須 | 作成日時         | 作成時刻と一致                      |
| updatedAt   | timestamp | 必須 | 更新日時         | 作成時は作成時刻と一致              |

## messages

パス: `tenants/{tenantId}/channels/{channelId}/messages/{messageId}`

| フィールド | 型        | 必須 | 内容             | 制約                                  |
| ---------- | --------- | ---- | ---------------- | ------------------------------------- |
| id         | string    | 必須 | メッセージID     | ドキュメントIDと一致                  |
| tenantId   | string    | 必須 | 所属テナントID   | パス上の`tenantId`と一致              |
| channelId  | string    | 必須 | 所属チャンネルID | パス上の`channelId`と一致             |
| body       | string    | 必須 | メッセージ本文   | -                                     |
| senderId   | string    | 必須 | 投稿者ID         | ログインユーザーのUIDと一致           |
| senderName | string    | 必須 | 投稿者名         | ログインユーザーの`displayName`と一致 |
| createdAt  | timestamp | 必須 | 投稿日時         | 作成時刻と一致                        |

## データの関係

```text
User ── belongs to ──> Tenant
Tenant ── has one ──> TenantSecret
Tenant ── has many ──> Channel
Channel ── has many ──> Message
Message ── belongs to ──> User
```

`tenantId`と`channelId`をドキュメントのパスと一致させ、別のテナントやチャンネルへの不正な紐付けを防ぐ。

## 主なクエリ

| 目的                 | 取得方法                                               |
| -------------------- | ------------------------------------------------------ |
| ログインユーザー取得 | `users/{userId}`をUIDで取得                            |
| 所属テナント取得     | `tenants/{tenantId}`をユーザーの`tenantId`で取得       |
| 参加先テナント検索   | `tenantSecrets`から`joinCode`の一致する文書を検索      |
| チャンネル一覧取得   | `tenants/{tenantId}/channels`を`createdAt`の昇順で取得 |
| メッセージ一覧取得   | チャンネル配下の`messages`を`createdAt`の昇順で取得    |

## 権限制御に使用するデータ

| データ       | 用途                                             |
| ------------ | ------------------------------------------------ |
| `tenantId`   | ユーザーが参照・操作できるテナントを判定する     |
| `role`       | チャンネル作成権限を判定する                     |
| `joinCode`   | 登録時に参加先テナントを特定する                 |
| `senderId`   | メッセージ投稿者のなりすましを防ぐ               |
| `senderName` | 投稿時点の表示名を保持し、投稿者名として表示する |
