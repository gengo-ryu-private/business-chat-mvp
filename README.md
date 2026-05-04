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
- UI: React
- 認証: Firebase Authentication
- データベース: Cloud Firestore
- テスト: Vitest

React Testing Library と Playwright は、画面実装が進む Phase 2 以降で導入します。

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
```

Firebase Console の以下から値を確認できます。

```text
プロジェクト設定
→ 全般
→ マイアプリ
→ Firebase SDK snippet
→ 構成
```

`measurementId` は Firebase Analytics 用の値です。現時点では Analytics を使わないため不要です。

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
本番公開前には `firestore.rules` をもとに Security Rules を設定します。

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

## 現在の主な画面

| URL | 概要 |
|---|---|
| `/signup` | 新規テナント作成または参加コードによるユーザー登録 |
| `/login` | メールアドレスとパスワードによるログイン |
| `/channels` | 認証後のチャンネル一覧プレースホルダー |
| `/channels/[channelId]` | 認証後のチャンネル詳細プレースホルダー |
| `/tenant` | 認証後のテナント情報プレースホルダー |

チャンネル一覧、チャンネル詳細、テナント情報の本格的な画面実装は Phase 2 で行います。
