# 技術構成

## 目的

機能要件とデータ処理を実現するために採用した技術、その役割、主要な技術判断を整理する。

## 採用技術

| 分類                 | 技術                                              | 役割                                     |
| -------------------- | ------------------------------------------------- | ---------------------------------------- |
| フレームワーク       | Next.js                                           | 画面、ルーティング、Route Handler        |
| UI                   | React、Tailwind CSS、shadcn/ui、Lucide            | 画面とコンポーネントの構築               |
| 言語                 | TypeScript                                        | データ、入力、コンポーネントの型定義     |
| 認証                 | Firebase Authentication                           | メールアドレスとパスワードによる認証     |
| データベース         | Cloud Firestore                                   | アプリデータの保存とリアルタイム購読     |
| サーバー側SDK        | Firebase Admin SDK                                | 登録時の認証ユーザーとアプリデータの作成 |
| アクセス制御         | Firestore Security Rules                          | 認証、テナント、ユーザー種別による制御   |
| 関数テスト           | Vitest                                            | ロジック、バリデーション、データ生成     |
| コンポーネントテスト | React Testing Library                             | 表示、入力、ユーザー操作                 |
| E2Eテスト            | Playwright、Firebase Emulator                     | 主要な利用フロー                         |
| Rulesテスト          | Firebase Emulator、`@firebase/rules-unit-testing` | Firestoreのアクセス制御と入力制約        |

詳細なテスト方針は `docs/08-test-policy.md` に整理する。

## 全体構成

```text
ブラウザ（Next.js / React / TypeScript）
  ├─ 登録・参加
  │    └─ Route Handler
  │         └─ Firebase Admin SDK
  │              ├─ Firebase Authentication
  │              └─ Firestore
  ├─ ログイン・ログアウト
  │    └─ Firebase Client SDK ── Firebase Authentication
  └─ ログイン後の通常操作
       └─ Firebase Client SDK ── Firestore Security Rules ── Firestore
```

## 登録処理のサーバー集約

新規テナント作成と既存テナント参加は、Next.js Route HandlerからFirebase Admin SDKを使用して処理する。

以下をブラウザの自己申告に依存させず、サーバー側で決定するためである。

- 認証ユーザーの作成
- 参加コードによるテナント検索
- `tenantId`と`role`の決定
- `users`と`tenants`の作成
- 途中で失敗した場合の後始末

Firebase Admin SDKはFirestore Security Rulesを経由しないため、Route Handler側で入力検証と権限情報の決定を行う。

## ログイン後のデータ操作

チャンネルとメッセージの取得・作成にはFirebase Client SDKを使用する。

Firestore Security Rulesで以下を検証する。

- ログイン状態
- 所属テナント
- チャンネル作成時の`admin`権限
- 作成可能なフィールドと値
- メッセージの投稿者と投稿先チャンネル

メッセージ一覧にはFirestoreのリアルタイム購読を使用し、新しい投稿を画面更新なしで反映する。

## データ構成

テナント配下にチャンネル、チャンネル配下にメッセージを配置し、データの所属範囲をパスから判断できる構成にする。

詳細は `docs/04-data-model.md`、作成手順は `docs/05-data-flow.md` に整理する。

## 実行環境と秘密情報

Route Handlerを使用するため、本番環境にはNext.jsをサーバー実行できる環境が必要であり、静的ホスティングだけでは動作しない。

Firebase Admin SDKの認証情報はサーバー側の環境変数に設定し、`NEXT_PUBLIC_`で始まる変数やブラウザへ公開しない。
