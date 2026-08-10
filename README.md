# business-chat-mvp

転職活動用ポートフォリオとして作成した、業務用チャットアプリのMVPです。

小規模な組織での情報共有を想定し、認証、テナント分離、チャンネル管理、メッセージ投稿を実装しています。

## デモ

デモ URL: [https://business-chat-mvp.vercel.app/](https://business-chat-mvp.vercel.app/)

公開デモでは、データ保護のため新規テナント作成を無効化しています。
応募先ごとに専用のデモテナントとアカウントを作成し、その応募先にだけ共有します。
公開デモの構築とデータ運用は、[デプロイガイド](./docs/10-deployment-guide.md)と[公開デモの運用手順](./docs/11-demo-operations.md)に整理しています。

<img
  src="./docs/images/channel-detail.png"
  alt="チャンネル内でのメッセージ共有"
  width="800"
/>

## 作成目的

このアプリは、自社開発企業への転職に向けたポートフォリオとして作成しています。

### 実装したアプリ

小規模組織の情報共有を想定した、簡易的な業務用チャットアプリです。単なるチャット画面にとどまらず、認証、権限制御、テナントごとのデータ分離など、業務アプリに必要な機能を実装しています。

### この制作で示したい対応範囲

Webアプリケーションの設計、実装、テストから、公開環境の構築・運用まで、一連の開発フェーズを一人で進められることを示すことを目的としています。

## 主な機能

- ユーザー登録
- ログイン、ログアウト
- 新規テナント作成
- 参加コードによる既存テナント参加
- チャンネル一覧表示
- 管理者ユーザーによるチャンネル作成
- チャンネル内メッセージ投稿、表示
- メッセージのリアルタイム反映
- 所属テナント情報の表示

## 技術スタック

- フロントエンド: Next.js / TypeScript
- UI: React / Tailwind CSS / shadcn/ui
- 認証: Firebase Authentication
- データベース: Cloud Firestore
- サーバー側処理: Next.js Route Handler / Firebase Admin SDK
- テスト: Vitest / React Testing Library / Playwright

## 設計上のポイント

### 認証とテナント分離

ユーザーは必ず1つのテナントに所属し、テナント単位でチャンネルとメッセージを管理します。

ログイン後の通常操作では、Firebase Client SDK と Firestore Security Rules により、所属テナント内のデータだけを扱えるようにしています。

### 登録・参加処理

新規テナント作成と既存テナント参加は、Next.js Route Handler と Firebase Admin SDK で処理します。

参加コード検索、`role`、`tenantId`、`createdBy` の決定をサーバー側に寄せることで、権限の根拠をブラウザ側の自己申告に依存しない構成にしています。

### 権限制御

Firestore Security Rules では、主に以下を制御しています。

- 自分のユーザー情報のみ参照可能
- 所属テナントのみ参照可能
- クライアントから `users` / `tenants` は作成不可
- 管理者のみチャンネル作成可能
- 所属テナント内の既存チャンネルにのみメッセージ投稿可能

## テスト

このプロジェクトでは、関数、コンポーネント、E2E、Firestore Security Rules、
デモテナント運用CLIをテスト対象にしています。

```bash
npm run test
npm run test:rules
npm run test:demo-cli
npm run test:e2e
```

## ローカルでの確認方法

依存関係をインストールします。

```bash
npm install
```

`.env.local.example` を参考に `.env.local` を作成します。

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで以下を開きます。

```text
http://localhost:3000
```

## ドキュメント

詳細な設計内容は `docs/` 配下に整理しています。

- [想定ユーザーと課題](./docs/01-users.md)
- [MVPスコープ](./docs/02-scope.md)
- [機能要件](./docs/03-requirements.md)
- [データ設計](./docs/04-data-model.md)
- [データ処理フロー](./docs/05-data-flow.md)
- [画面設計](./docs/06-screens.md)
- [技術構成](./docs/07-tech-stack.md)
- [テスト方針](./docs/08-test-policy.md)
- [ドキュメント管理方針](./docs/09-documentation-policy.md)
- [公開デモのデプロイガイド](./docs/10-deployment-guide.md)
- [公開デモの運用手順](./docs/11-demo-operations.md)
- [面接・応募用のポートフォリオ説明](./docs/12-portfolio-explanation.md)

## MVPの制約と発展可能性

本アプリは、要件定義から公開環境の運用までを検証するMVPとして完成しています。
実運用規模へ拡張する場合は、以下の対応が考えられます。

- 参加コードの失効・再発行、複数管理者など、参加・権限管理の強化
- メッセージのページネーションと、チャンネル名の一意性などの拡張性・データ整合性の強化
- メッセージ検索の追加
- 通知、ファイル添付、既読管理などのチャット機能拡張
- 複数テナント所属を含む組織・アカウント管理の拡張
