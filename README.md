# business-chat-mvp

転職活動用ポートフォリオとして作成する、業務用チャットアプリのMVPです。

## 目的

このアプリは、自社開発企業への転職において、Webアプリケーションを一人で設計・実装・テストまで進められることを示すために作成します。

単にチャット機能を実装するだけではなく、以下を示すことを目的とします。

- 業務要件を整理できること
- MVPとして適切にスコープを絞れること
- 認証・テナント管理・チャンネル管理・メッセージ投稿などの業務アプリ機能を設計できること
- フロントエンド、バックエンド、データ設計を一貫して考えられること
- テスト設計まで含めて品質を意識できること
- 将来的な機能拡張を見据えた構成にできること

## 想定するアプリ概要

複数の組織が利用できる、シンプルな業務用チャットアプリです。

MVPでは、以下の機能を実装対象とします。

- ユーザー認証
- テナント管理
- チャンネル管理
- メッセージ投稿・表示

## 技術スタック

- フロントエンド: Next.js / TypeScript
- UI: React / Tailwind CSS / shadcn/ui
- 認証: Firebase Authentication
- データベース: Cloud Firestore
- サーバー側処理: Next.js Route Handler / Firebase Admin SDK
- テスト: Vitest / React Testing Library / Playwright

## ドキュメント

設計内容は `docs/` 配下に整理します。

- [ポートフォリオ作成の目的](./docs/01-purpose.md)
- [想定ユーザー](./docs/02-users.md)
- [MVPスコープ](./docs/03-scope.md)
- [機能要件](./docs/04-requirements.md)
- [データ設計](./docs/05-data-model.md)
- [画面一覧](./docs/06-screens.md)
- [技術構成](./docs/07-tech-stack.md)
- [テスト方針](./docs/08-test-policy.md)
- [実装計画](./docs/09-implementation-plan.md)

## 開発環境のセットアップ

### 依存関係のインストール

```bash
npm install
```

### 環境変数

`.env.local.example` を参考に、`.env.local` を作成します。

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=
```

`NEXT_PUBLIC_` で始まる値は Firebase Client SDK 用です。
Firebase Console の以下から確認できます。

```text
プロジェクト設定
→ 全般
→ マイアプリ
→ Firebase SDK snippet
→ 構成
```

`measurementId` は Firebase Analytics 用の値です。現時点では Analytics を使わないため不要です。

`FIREBASE_PROJECT_ID`、`FIREBASE_CLIENT_EMAIL`、`FIREBASE_PRIVATE_KEY` は Firebase Admin SDK 用です。
Firebase Console の以下からサービスアカウントキーを生成し、ダウンロードした JSON の値を設定します。

```text
プロジェクト設定
→ サービス アカウント
→ Firebase Admin SDK
→ 新しい秘密鍵の生成
```

JSON との対応は以下です。

```env
FIREBASE_PROJECT_ID=project_id の値
FIREBASE_CLIENT_EMAIL=client_email の値
FIREBASE_PRIVATE_KEY=private_key の値
```

`FIREBASE_PRIVATE_KEY` は秘密情報です。Git にコミットせず、`NEXT_PUBLIC_` も付けません。
`.env.local` では以下のようにクォートで囲み、改行は `\n` の形で保持します。

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` は E2E テストなどで Firebase Emulator に接続する場合に使用します。
通常のローカル開発で実 Firebase プロジェクトを使う場合は空のままで構いません。

### UI コンポーネント

このプロジェクトでは Tailwind CSS と shadcn/ui を使用します。

shadcn/ui の設定は `components.json` にあります。
UI コンポーネントは `src/components/ui/` 配下に配置します。

### Firebase Authentication

Firebase Console でメールアドレス/パスワード認証を有効化します。

```text
Authentication
→ Sign-in method
→ メール/パスワード
→ 有効にする
```

### Firestore Database

Firebase Console で Firestore Database を作成します。

```text
Firestore Database
→ データベースの作成
→ テストモードで開始
→ ロケーションを選択
```

開発中はテストモードで動作確認できます。
ただし、最終的な権限制御は `firestore.rules` をもとに Security Rules を設定します。

### 登録・参加処理のサーバー側実行

Phase 3 の要件・設計再確認により、ユーザー登録とテナント参加処理は Next.js Route Handler と Firebase Admin SDK に移行しています。

対象 API は以下です。

| API                              | 役割                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- |
| `POST /api/signup/create-tenant` | Firebase Auth ユーザー、テナント、admin ユーザー情報を作成             |
| `POST /api/signup/join-tenant`   | 参加コードを検証し、Firebase Auth ユーザーと member ユーザー情報を作成 |

この構成にした理由は、参加コード検索、`role`、`tenantId`、`createdBy` の決定をブラウザ側の自己申告に依存させないためです。

通常のチャンネル作成、メッセージ投稿、一覧取得は Firebase Client SDK と Firestore Security Rules で制御します。
一方で、権限の根拠を作る登録・参加処理はサーバー側で行います。

Route Handler と Firebase Admin SDK を使うため、このアプリは静的ホスティングのみでは完結しません。
ローカル開発では `npm run dev`、本番運用では Next.js のサーバー実行環境が必要です。

### 開発サーバー起動

```bash
npm run dev
```

ブラウザで以下を開きます。

```text
http://localhost:3000
```

### テスト実行

watch モードで実行します。

```bash
npm run test
```

1回だけ実行する場合は以下です。

```bash
npx vitest run
```

E2E テストは Firebase Emulator と Playwright を使って実行します。

```bash
npm run test:e2e
```

初回実行前に Playwright のブラウザが未インストールの場合は、以下を実行します。

```bash
npx playwright install chromium
```

E2E では Auth Emulator と Firestore Emulator を起動し、テスト用 project ID `business-chat-mvp-e2e` を使用します。
`playwright.config.ts` が E2E 用の Firebase 環境変数を dev server に渡すため、通常の `.env.local` を E2E 用に書き換える必要はありません。

## Phase 1 で実装済みの内容

- Firebase Authentication 連携
- Cloud Firestore 連携
- 新規テナント作成によるユーザー登録
- 参加コードによる既存テナント参加
- ログイン
- ログアウト
- 認証状態の共有
- 認証後画面のアクセス制御
- Firestore データアクセス層
- データモデル型定義
- バリデーション、権限判定、日付表示、参加コード生成
- Firestore 保存用データ生成
- Vitest による単体テスト
- Firestore Security Rules 初期方針

## Phase 2 で実装済みの内容

- 認証後画面の共通レイアウト
- 所属テナント名とログインユーザー情報の表示
- チャンネル一覧表示
- 管理者ユーザー向けチャンネル作成
- 一般ユーザー向けチャンネル作成フォーム非表示
- チャンネル詳細表示
- メッセージ一覧表示
- メッセージ投稿
- 投稿者名と投稿日時の表示
- テナント情報表示
- 管理者ユーザーのみ参加コード表示
- Tailwind CSS / shadcn/ui による基本 UI 整備

## Phase 3 で実装済みの内容

- 要件・設計・実装の再確認
- 参加コード検索と Firestore Security Rules の整合性確認
- 登録・参加処理の Next.js Route Handler 移行
- Firebase Admin SDK 導入
- サーバー側での Firebase Authentication ユーザー作成
- サーバー側での `admin` / `member` 決定
- クライアントからの `users` / `tenants` 直接作成を禁止
- Firestore Security Rules の強化
- 登録 API の入力検証・保存データ生成に対する単体テスト追加
- チャンネル詳細画面のメッセージ一覧を Firestore リアルタイム購読に対応
- React Testing Library 導入
- 主要フォーム・表示部品のコンポーネント分離
- 主要フォーム・表示制御・メッセージ一覧のコンポーネントテスト追加
- Playwright 導入
- Firebase Emulator を使った E2E テスト設定
- admin 登録、チャンネル作成、member 登録、メッセージ投稿、リアルタイム表示、認証制御の E2E テスト追加

## 現在の主な画面

| URL                     | 概要                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `/`                     | 認証状態に応じて `/login` または `/channels` へ遷移        |
| `/signup`               | 新規テナント作成または参加コードによるユーザー登録         |
| `/login`                | メールアドレスとパスワードによるログイン                   |
| `/channels`             | 所属テナント内のチャンネル一覧とチャンネル作成             |
| `/channels/[channelId]` | チャンネル詳細、リアルタイムメッセージ一覧、メッセージ投稿 |
| `/tenant`               | 所属テナント情報とユーザー情報の表示                       |

## 権限制御の考え方

このMVPでは、処理の種類によって責務を分けています。

```text
登録・参加
  → Next.js Route Handler + Firebase Admin SDK

ログイン後の通常操作
  → Firebase Client SDK + Firestore Security Rules
```

登録・参加処理では、サーバー側で Firebase Authentication ユーザーと Firestore のアプリ用ユーザー情報を作成します。
これにより、`role` や `tenantId` をクライアントが自由に指定できない構成にしています。

Firestore Security Rules では、ログイン後の通常操作を制御します。

- 自分の `users/{userId}` のみ参照可能
- 所属テナントのみ参照可能
- クライアントから `users` / `tenants` は作成不可
- 管理者のみチャンネル作成可能
- 所属テナント内の既存チャンネルにのみメッセージ投稿可能
- チャンネル・メッセージ作成時の主要フィールドを検証

## 今後の拡張候補

- Firebase Emulator を使った Firestore Security Rules テスト
- メッセージ検索、通知、ファイル添付、既読管理などのチャット機能拡張
- 複数テナント所属や複数管理者への対応
