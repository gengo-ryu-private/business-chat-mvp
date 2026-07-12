# 公開デモのデプロイガイド

## 目的

開発者がVercel、Firebase、Upstashで公開デモ環境を再構築するための手順を示す。
デプロイ結果は記録せず、環境固有の値や秘密情報も記載しない。
デモアカウントとデータの管理は `docs/11-demo-operations.md` で扱う。

## 構成

公開デモはローカル開発やE2Eテストから分離し、Firebase SparkとVercel Hobbyで運用する。
専用のFirebaseプロジェクトとUpstash RedisをVercel Productionから使用し、
Preview環境はProductionのFirebaseへ接続しない。

| サービス                | 用途                                           |
| ----------------------- | ---------------------------------------------- |
| Vercel                  | Next.jsとRoute Handlerの実行                   |
| Firebase Authentication | メールアドレスとパスワードによる認証           |
| Cloud Firestore         | アプリデータの保存                             |
| Firebase Admin SDK      | signup APIからの認証ユーザーと初期データの作成 |
| Upstash Redis           | signup APIのIPアドレス単位のrate limit         |

## 構築手順

### Firebase

公開デモ専用プロジェクトにWebアプリを追加し、メール/パスワード認証を有効にしてFirestoreを作成する。
Firebase Authenticationの承認済みドメインには、
Vercelの公開ドメインと使用する独自ドメインを追加する。

サービスアカウントからAdmin SDK用の値を取得するが、
JSON、秘密鍵、`.env.local` はコミットしない。
`FIREBASE_PRIVATE_KEY` の改行は `\n` としてVercelに保存する。
漏えい時は鍵を失効して差し替える。

Security Rulesはテスト後、対象のプロジェクトIDを確認して反映する。

```bash
npm run test:rules
npx firebase-tools deploy --only firestore:rules --project <公開デモのFirebaseプロジェクトID>
```

### Upstash

公開デモ用Redisを作成し、REST API URLとトークンをVercelへ設定する。
`RATE_LIMIT_ENABLED=true` のとき、新規テナント作成は1時間に3回、
既存テナントへの参加は10分間に5回までとなる。

Redis障害時はsignup処理を継続する実装のため、rate limitだけに依存せず、
公開後は新規テナント作成も停止する。

### Vercel環境変数

Client SDKとAdmin SDKには、同じ公開デモ用Firebaseプロジェクトの値を設定する。

```dotenv
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# 公開制限
DISABLE_PUBLIC_TENANT_SIGNUP=true
NEXT_PUBLIC_DISABLE_TENANT_SIGNUP=true
RATE_LIMIT_ENABLED=true

# Upstash
UPSTASH_REDIS_REST_KV_REST_API_URL=
UPSTASH_REDIS_REST_KV_REST_API_TOKEN=
```

2つのテナント作成制限は、サーバー側の拒否と画面上の導線非表示をそれぞれ担当する。
既存テナントへの参加は可能なため、参加コードは公開しない。
Emulator用の環境変数はProductionに設定しない。

## デプロイ

1. `npm run lint`、`npm run format:check`、`npm run test -- --run`、
   `npm run test:rules`、`npm run build` を実行する。
2. Security Rulesを公開デモ用Firebaseへ反映する。
3. VercelのProduction環境変数を設定してデプロイする。
4. 初回はVercelドメインをFirebase Authenticationの承認済みドメインへ追加する。
5. 環境変数を変更した場合は再デプロイする。

初期データを作るときだけテナント作成制限を一時解除し、
`docs/11-demo-operations.md` の初期化手順を終えたら有効に戻す。

## 公開後の確認

adminとmemberで、ログイン、権限差、チャンネル作成、メッセージ投稿、
リアルタイム反映、ログアウトを確認する。
未ログイン時のアクセス制御、新規テナント作成APIの403、
rate limit超過時の429と `Retry-After` も確認する。

SparkとHobbyでは予算アラートを設定せず、案内前と週1回を目安に
Firebase、Vercel、UpstashのUsage画面を確認する。
FirebaseではAuthenticationのユーザー数とFirestoreの読み書き・保存量、
Vercelではリクエスト数、Function実行、データ転送量、エラー、
Upstashではコマンド数と保存量を確認する。
無料枠への接近や異常な増加を確認した場合は案内を止めて原因を調査する。

FirebaseをBlazeへ変更した場合はGoogle Cloud Billingの予算アラート、
VercelをProへ変更した場合はSpend Managementを設定する。
