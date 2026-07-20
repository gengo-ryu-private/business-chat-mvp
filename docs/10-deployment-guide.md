# 公開デモのデプロイガイド

## 目的

現在の公開デモ環境で使用しているVercel、Firebase、Upstashの構成と、
デプロイ、再デプロイ、点検の手順を示す。
デプロイ結果、環境固有の秘密情報、デモ認証情報は記載しない。
応募先ごとのテナント発行とデータ管理は `docs/11-demo-operations.md` で扱う。

## 構成

公開デモはローカル開発やE2Eテストから分離し、専用のFirebaseとUpstash Redisを
Vercel Productionから使用する。Preview環境はProductionのFirebaseへ接続しない。

| サービス      | 用途                                     |
| ------------- | ---------------------------------------- |
| Vercel        | Next.jsとRoute Handlerの実行             |
| Firebase      | AuthenticationとCloud Firestore          |
| Upstash Redis | signup APIのIPアドレス単位のrate limit   |
| Google Cloud  | デモテナント運用CLIの鍵なし認証とIAM制御 |

## Firebase

公開デモ専用プロジェクトにWebアプリを追加し、メール/パスワード認証を有効にして
Firestoreを作成する。Firebase Authenticationの承認済みドメインには、
Vercelの公開ドメインと使用する独自ドメインを追加し、Firebaseの既定プロジェクトドメインは残す。
CLIはブラウザ認証を使用しないため、運用目的で `localhost` を追加する必要はない。

VercelのAdmin SDK用サービスアカウントから環境変数の値を取得するが、
JSON、秘密鍵、`.env.local` はコミットしない。
`FIREBASE_PRIVATE_KEY` の改行は `\n` としてVercelに保存する。

Security Rulesはテスト後、対象のプロジェクトIDを確認して反映する。

```bash
npm run test:rules
npx firebase-tools deploy --only firestore:rules \
  --project business-chat-mvp-prod
```

## デモテナント運用CLI用IAM

この設定は公開デモ環境の初回構築時に1回だけ行う。
実行には対象プロジェクトのIAMを変更できる権限が必要だが、日常のCLI運用に
Project Owner権限は使用しない。
サービスアカウントやカスタムロールがすでに存在する場合は、作成コマンドを再実行せず、
`describe`とIAMポリシーで設定内容を確認する。

CLIは次のサービスアカウントをADCで偽装し、JSON鍵を発行せずに本番Firebaseへ接続する。
CLI自身もADCから解決したサービスアカウントメールを照合し、
個人ADCや別のサービスアカウントによる実行を拒否する。

```text
demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com
```

### IAM Credentials APIとサービスアカウント

```bash
gcloud services enable iamcredentials.googleapis.com \
  --project=business-chat-mvp-prod

gcloud iam service-accounts create demo-tenant-operator \
  --project=business-chat-mvp-prod \
  --display-name="Business Chat Demo Tenant Operator" \
  --description="Provision, reset, and delete applicant demo tenants"
```

Firestore操作権限をサービスアカウントへ付与する。

```bash
gcloud projects add-iam-policy-binding business-chat-mvp-prod \
  --member="serviceAccount:demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com" \
  --role="roles/datastore.user" \
  --condition=None
```

Firebase Authenticationはユーザーの作成、取得、削除だけを許可するカスタムロールを使用する。
一覧取得や更新、IAM変更権限は付与しない。

```bash
gcloud iam roles create demoTenantAuthOperator \
  --project=business-chat-mvp-prod \
  --title="Demo Tenant Authentication Operator" \
  --description="Create, verify, and delete demo tenant authentication users" \
  --permissions="firebaseauth.users.create,firebaseauth.users.get,firebaseauth.users.delete" \
  --stage=GA

gcloud projects add-iam-policy-binding business-chat-mvp-prod \
  --member="serviceAccount:demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com" \
  --role="projects/business-chat-mvp-prod/roles/demoTenantAuthOperator" \
  --condition=None
```

### 運用者への偽装権限

運用者のGoogleアカウントに、対象サービスアカウントだけの
`Service Account Token Creator`を付与する。次のメールアドレスは実際の運用者へ置き換える。

```bash
DEMO_OPERATOR_EMAIL="operator@example.com"

gcloud iam service-accounts add-iam-policy-binding \
  demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com \
  --project=business-chat-mvp-prod \
  --member="user:${DEMO_OPERATOR_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

サービスアカウント鍵は作成しない。次の確認で何も表示されなければ、
ユーザー管理鍵は0件である。

```bash
gcloud iam service-accounts keys list \
  --iam-account=demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com \
  --project=business-chat-mvp-prod \
  --filter="keyType=USER_MANAGED" \
  --format="value(name)"
```

`gcloud iam service-accounts keys create`は使用しない。
IAM設定後のADCログインと日常運用は `docs/11-demo-operations.md` に従う。

## Upstash

公開デモ用Redisを作成し、REST API URLとトークンをVercelへ設定する。
`RATE_LIMIT_ENABLED=true` のとき、新規テナント作成は1時間に3回、
既存テナントへの参加は10分間に5回までとなる。

Redis障害時はsignup処理を継続する実装のため、rate limitだけに依存せず、
公開後は新規テナント作成も停止する。

## Vercel

GitHubリポジトリをVercelへImportし、Production Branchを `main` に設定する。
Previewには公開デモ用Firebaseの値を設定しない。

### 環境変数

Client SDKとAdmin SDKには、同じ公開デモ用Firebaseプロジェクトの値を設定する。
以下の環境変数はProductionだけに設定する。

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
応募先用テナントは運用CLIで発行するため、発行時も両方を常に `true` に維持する。
既存テナントへの参加は可能なため、参加コードは公開しない。
Emulator用の環境変数はProductionに設定しない。

## デプロイ

1. `npm run lint`、`npm run format:check`、`npm run test -- --run`、
   `npm run test:rules`、`npm run test:demo-cli`、`npm run build` を実行する。
2. Security Rulesを公開デモ用Firebaseへ反映する。
3. 初回はGitHubリポジトリをVercelへImportし、Production Branchが `main` であることを確認する。
4. VercelのProduction環境変数を設定してProductionへデプロイする。
5. 発行されたVercelドメインをFirebase Authenticationの承認済みドメインへ追加する。

`main`へのpushによる自動デプロイ、またはVercelのDeployments画面からのRedeployで
再デプロイする。環境変数を変更した場合は、その値を反映するため必ず再デプロイする。

## 公開後の確認

adminとmemberで、ログイン、権限差、チャンネル作成、メッセージ投稿、
リアルタイム反映、ログアウトを確認する。
未ログイン時のアクセス制御、新規テナント作成APIの403、
rate limit超過時の429と `Retry-After` も確認する。
