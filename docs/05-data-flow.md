# データ処理フロー

## 目的

主要機能がFirebase AuthenticationとFirestoreのデータを作成・取得する手順と、クライアント・サーバー・Firestore Security Rulesの責務を整理する。

データ構造は `docs/04-data-model.md`、採用技術は `docs/07-tech-stack.md` に整理する。

入力値と権限の条件は `docs/03-requirements.md` を正とし、このドキュメントでは検証する場所だけを扱う。

## 責務分担

| 実行場所                 | 責務                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| ブラウザ                 | 入力、画面上の検証、ログイン後の通常操作                               |
| Next.js Route Handler    | 登録入力の検証、認証ユーザー作成、テナント作成・検索、所属と権限の決定 |
| Firebase Admin SDK       | サーバー側からFirebase AuthenticationとFirestoreを操作                 |
| Firebase Client SDK      | ログイン、ログイン後のデータ取得と作成                                 |
| Firestore Security Rules | ログイン後のデータ参照・作成を認証状態、`tenantId`、`role`で制御       |

登録処理では、`role`や`tenantId`をブラウザの入力から決定せず、Route Handlerが処理内容と参加コードから決定する。

## 新規テナント作成による登録

1. ブラウザで入力値を検証する
2. Route Handlerへユーザー名、メールアドレス、パスワード、テナント名を送信する
3. Route Handlerで同じ入力値を再検証する
4. Firebase Admin SDKで認証ユーザーを作成する
5. 参加コードを生成し、`tenants/{tenantId}`を作成する
6. `role`を`admin`に固定し、`users/{userId}`を作成する
7. ブラウザから作成したメールアドレスとパスワードでログインする

`tenantId`、`joinCode`、`createdBy`、`role`はサーバー側で決定する。

## 既存テナント参加による登録

1. ブラウザで入力値を検証する
2. Route Handlerへユーザー名、メールアドレス、パスワード、参加コードを送信する
3. Route Handlerで同じ入力値を再検証する
4. Firebase Admin SDKで参加コードに一致するテナントを検索する
5. Firebase Admin SDKで認証ユーザーを作成する
6. 検索結果の`tenantId`を使用し、`role`を`member`に固定して`users/{userId}`を作成する
7. ブラウザから作成したメールアドレスとパスワードでログインする

参加コードに一致するテナントがない場合は、認証ユーザーを作成しない。

## チャンネル作成

1. 管理者ユーザーがチャンネル名と説明を入力する
2. ブラウザで必須、文字数、同一テナント内の名前重複を確認する
3. Firebase Client SDKで所属テナント配下にチャンネルを作成する
4. Firestore Security Rulesが認証状態、`tenantId`、`role`、必須フィールド、文字数を検証する
5. 作成後にチャンネル一覧を再取得する

一般ユーザーによる作成や、別テナントへの作成はFirestore Security Rulesで拒否する。

チャンネル名の一意性はブラウザ側だけで確認しているため、同時作成による重複までは保証しない。

## メッセージ投稿・表示

1. ユーザーがメッセージ本文を入力する
2. ブラウザで本文が機能要件の入力条件を満たすことを確認する
3. Firebase Client SDKで対象チャンネル配下にメッセージを作成する
4. Firestore Security Rulesが認証状態、`tenantId`、`channelId`、投稿者、本文の必須・文字数を検証する
5. Firestoreのリアルタイム購読からメッセージ一覧へ反映する

## 登録失敗時の扱い

登録処理の途中で失敗した場合は、作成済みデータの削除を試みる。

- 認証ユーザー作成後にFirestoreへの保存で失敗した場合は、作成済みの認証ユーザーを削除する
- ユーザー情報の作成に失敗した場合は、作成済みのテナントと認証ユーザーを削除する
- 後始末に失敗した場合も、ブラウザには登録失敗としてエラーを返す
