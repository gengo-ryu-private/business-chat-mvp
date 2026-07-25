# 公開デモの運用手順

## 目的

デモ運用者が、応募先ごとに分離したデモテナントとアカウントを発行、共有、点検、リセット、削除するための手順を示す。

公開環境の構成、IAM、デプロイは `docs/10-deployment-guide.md` で扱う。

## 運用方針

応募先ごとに専用のテナントを1件作成し、異なる応募先の間でテナント、アカウント、チャンネル、メッセージを共有しない。
各テナントにはCLIでadminとmemberを各1ユーザー作成する。

Vercel Productionの `DISABLE_PUBLIC_TENANT_SIGNUP` と`NEXT_PUBLIC_DISABLE_TENANT_SIGNUP` は常に `true` のまま維持する。
CLIはVercelの設定や公開サイトを変更せず、ADCによるサービスアカウント偽装でFirebase AuthenticationとFirestoreへ直接接続する。

認証情報と参加コードはREADME、GitHub、公開プロフィールへ記載しない。
テナントID、各UID、認証情報、発行先、選考終了予定を、アクセスを制限したパスワード管理手段に記録する。

参加コードはテナントへmemberを追加できるため、認証情報と同様に扱う。

## 認証情報の共有

認証情報は応募先ごとに発行した使い捨てアカウントとして、対象の採用担当者へメールで共有する。
メール本文には公開URLとadmin/memberのメールアドレス、パスワードだけを記載し、参加コード、テナントID、UIDは含めない。
メールの件名にも認証情報を記載しない。

応募経路ごとの扱いは次のとおりとする。

- 企業へ直接応募する場合は、対象企業の採用担当者へ送信する
- 転職エージェント経由では、応募先ごとに分けたメールを作成し、対象企業だけへの転送を依頼する
- 逆指名型サービスでは、採用担当者の連絡可能なメールアドレスを確認して送信する
- 公開README、プロフィール、不特定多数向けの投稿では認証情報を共有しない

送信前に宛先と応募先を運用記録と照合する。
運用記録には共有経路、共有先、共有日、テナントID、選考終了予定を記録する。

誤送信、辞退、認証情報の漏えい、想定外の利用を確認した場合は、後述の「漏えい・異常時」に従う。
選考終了後は「選考終了時の削除」に従う。

## CLIの安全機構

CLIは次の条件を満たさない場合、Firebase操作を開始しない。

- Node.js 22で実行する
- `--project business-chat-mvp-prod`を明示する
- 本番プロジェクト以外を指定しない
- `GOOGLE_APPLICATION_CREDENTIALS`を使用せず、鍵なしADCで接続する
- ADCのサービスアカウント主体が専用の運用アカウントと一致する
- Firebase Emulatorの環境変数が設定されていない
- 書き込み操作では対話端末からプロジェクトIDを手入力する
- リセットと削除ではテナントIDも手入力する

メールアドレス、パスワード、参加コードをコマンド引数やファイルで渡さない。

標準出力をファイルへリダイレクトしたり、`tee`で保存したりしない。

## 初回準備

`docs/10-deployment-guide.md`のIAM設定を完了してから、リポジトリ直下で依存関係を導入する。

```bash
node --version
npm install
```

Node.jsは22系を使用する。CLIの変更後や依存関係の更新後は、本番操作の前にAuth・Firestore Emulatorによるテストを実行する。

```bash
npm run test:demo-cli
```

このテストは `business-chat-mvp-e2e` だけを使用し、本番Firebaseを変更しない。

## ADCログインと接続確認

サービスアカウントを偽装するADCをローカルへ設定する。
ブラウザが開いた場合は、`docs/10-deployment-guide.md`で偽装権限を付与した運用者のGoogleアカウントでログインする。

```bash
gcloud auth application-default login \
  --impersonate-service-account=demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com \
  --project=business-chat-mvp-prod
```

ADC設定には運用者の認証と偽装先が保存されるが、サービスアカウント秘密鍵は作成されない。
端末のOSアカウントとローカルADCを適切に保護する。

作業を始めるたびに、秘密情報を表示せずADCトークン取得とCLIの読取権限を確認する。

```bash
gcloud auth application-default print-access-token >/dev/null && \
  echo "ADC impersonation ready"

npm run demo:check -- --project business-chat-mvp-prod
```

CLIはADCの主体が`demo-tenant-operator@business-chat-mvp-prod.iam.gserviceaccount.com`と一致することも検証する。
個人ADCや別のサービスアカウントでは、Firebaseへの権限があっても拒否する。

`ADC access verified`と`No data was changed`が表示された場合だけ次へ進む。
失敗した場合は、対象アカウント、偽装権限、ADCログイン、IAM設定を確認し、書き込みコマンドは実行しない。

## 公開制限の確認

発行前に、公開サイトの新規テナント作成APIが403を返すことを確認する。

空のリクエストが400を返す場合はProductionの制限が解除されている可能性があるため、発行を開始しない。

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST https://business-chat-mvp.vercel.app/api/signup/create-tenant \
  -H 'Content-Type: application/json' \
  --data '{}'
```

CLI運用では `.env.development.local` の作成、ローカル開発サーバーの起動、Vercel環境変数の変更、再デプロイは行わない。

## 初期デモデータ

発行コマンドは応募先ごとに新しいテナントを作り、次の架空データを設定する。

| 種別       | 内容                                       |
| ---------- | ------------------------------------------ |
| テナント   | `サンプル開発チーム`                       |
| admin      | `デモ管理者`、自動生成メールとパスワード   |
| member     | `デモメンバー`、自動生成メールとパスワード |
| チャンネル | `お知らせ`、`雑談`                         |
| メッセージ | 機能を確認するための架空の短い会話4件      |

メールアドレス、パスワード、参加コードは応募先テナントごとに異なる。

実在する人物や企業の情報、個人情報、機密情報は保存しない。
応募先にも架空の内容だけを入力するよう案内する。

## テナントとアカウントの発行

ADCと公開制限を確認後、次を実行する。

```bash
npm run demo:provision -- --project business-chat-mvp-prod
```

CLIに表示されたプロジェクトIDと操作名を確認し、続行する場合だけ`business-chat-mvp-prod`を手入力する。

発行処理はテナント、参加コード、admin/member、初期チャンネル、初期メッセージを作成し、AuthとFirestoreの整合性を検証する。
途中で失敗した場合は、この実行で作成したAuthユーザーとFirestoreデータを自動的にロールバックする。

エラーに手動確認が必要と表示された場合は再発行せず、表示されたUIDとFirebaseの状態を確認する。

成功時に次の値が一度だけ表示される。

- テナントIDと参加コード
- adminのメールアドレス、パスワード、UID
- memberのメールアドレス、パスワード、UID

表示された値を直ちにパスワード管理手段へ保存し、応募先と選考終了予定を関連付ける。
画面のスクリーンショットやターミナル出力ファイルは作成しない。

認証情報を保存できなかった場合は、該当テナントを削除してから再発行する。

### 発行後の確認と共有

1. adminとmemberの両方で公開URLへログインする。
2. adminだけがチャンネルを作成できることを確認する。
3. 両ユーザーがメッセージを投稿でき、リアルタイム反映されることを確認する。
4. テナント名、初期2チャンネル、初期4メッセージを確認する。
5. 公開サイトの新規テナント作成APIが引き続き403を返すことを確認する。
6. 公開URLと各ユーザーのメールアドレス、パスワードだけを対象の応募先へ共有する。

参加コード、テナントID、UIDは運用記録に残すが、通常の案内では共有しない。

admin画面から参加コードを確認できるため、admin認証情報の共有範囲も限定する。

## 案内中の点検

案内前と週1回を目安に、各応募先のログイン、権限、データ内容、想定外のテナント、各サービスの利用量を確認する。

Firebaseではユーザー数とFirestore、VercelではリクエストとFunction、Upstashではコマンド数と保存量を確認する。

## デモデータのリセット

リセットは対象テナントの全チャンネルとメッセージを削除し、初期2チャンネルと初期4メッセージを再作成する。
テナント、参加コード、admin/member、パスワードは変更しない。

リセット中は対象の応募先へ一時的に利用停止を案内し、運用記録のテナントIDを照合する。

```bash
npm run demo:reset -- \
  --project business-chat-mvp-prod \
  --tenant-id <対象のテナントID>
```

プロジェクトIDとテナントIDをそれぞれ手入力して続行する。

CLIはテナント、参加コード、Firestoreユーザー、Authユーザーを事前確認し、adminとmemberが各1件ではない場合やデータに不整合がある場合は削除を開始しない。

成功後、既存のadmin/member認証情報でログインし、権限と初期データを確認してから案内を再開する。

途中で失敗した場合は案内を再開せず、同じコマンドを再実行して初期データを検証する。

## 選考終了時の削除

選考終了後は、運用記録のテナントIDを照合して次を実行する。

```bash
npm run demo:deprovision -- \
  --project business-chat-mvp-prod \
  --tenant-id <対象のテナントID>
```

プロジェクトIDとテナントIDをそれぞれ手入力して続行する。
CLIは次の順序で削除する。

1. 対象テナントのUID対応表を`demoTenantDeprovisions/{tenantId}`へ保存する
2. テナント配下の全サブコレクション
3. 対象テナントを参照する全Firebase Authenticationユーザー
4. `users/{userId}`、`tenantSecrets/{tenantId}`、`tenants/{tenantId}`
5. AuthとFirestoreに対象データが残っていないことの検証
6. UID対応表を`completed`へ更新する

`demoTenantDeprovisions`はAdmin SDKだけが使用する削除再試行用の非公開メタデータで、クライアントには読み書きを許可しない。
通常の`users`文書を削除した後もUID対応表を保持するため、途中で停止した場合やサブコレクションが遅れて残った場合も同じコマンドを再実行できる。

削除完了後も完了済みトゥームストーンを保持し、再実行時にAuthユーザーが削除済みであることを再検証する。

旧バージョンのCLIなどによってFirestoreデータがすでにすべて存在せず、トゥームストーンもない場合だけは、UID対応表がないためAuthユーザーを再照合できない。

CLIはこの場合を成功表示と区別して警告する。

## 漏えい・異常時

認証情報の漏えいや異常な利用を確認した場合は対象の応募先への案内を停止し、該当テナントを削除する。
特定テナントの初期データだけに問題がある場合はリセットする。

Vercel用Admin SDK秘密鍵やUpstashトークンが関係する場合は失効・再発行し、Vercelを再デプロイする。
ADCを使用していた端末やGoogleアカウントが関係する場合は、Googleアカウントのセッション、対象サービスアカウントのIAM、ローカルADCを見直す。

Firebaseプロジェクト全体の安全性を判断できない場合は案内を停止し、`docs/10-deployment-guide.md`で現在の構成と設定を確認して復旧方針を決める。
