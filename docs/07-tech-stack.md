# 技術構成

## このドキュメントの目的

このドキュメントでは、業務用チャットアプリMVPで使用する技術構成を整理する。

`docs/02-users.md` では、小規模組織における業務連絡の課題を整理した。  
`docs/03-scope.md` では、その課題に対してMVPで対応する範囲を定義した。  
`docs/04-requirements.md` では、MVPで実装する機能要件を整理した。  
`docs/05-data-model.md` では、Firestore を前提としたデータ構造を整理した。  
`docs/06-screens.md` では、ユーザーが操作する画面を整理した。

このドキュメントでは、それらを実現するために採用する技術と、各技術の役割を明確にする。

## 技術選定の方針

このポートフォリオでは、以下を重視して技術を選定する。

- 転職活動で説明しやすい構成であること
- 業務用Webアプリとして一般的な構成であること
- 認証、データ管理、画面実装、テストまで一通り扱えること
- MVPとして完成まで進めやすいこと
- インフラ構築に時間をかけすぎず、アプリケーション設計と実装に集中できること
- 将来的な機能拡張を説明できること

今回の目的は、多機能なチャットツールを作ることではなく、小規模組織の情報共有課題を題材に、業務アプリケーションの基本構造を設計・実装・テストできることを示すことである。

## 採用技術一覧

| 分類                 | 使用技術                | 主な役割                                         |
| -------------------- | ----------------------- | ------------------------------------------------ |
| フレームワーク       | Next.js                 | 画面実装、ルーティング、アプリ全体の構成         |
| UI                   | React                   | コンポーネントベースの画面構築                   |
| 言語                 | TypeScript              | 型安全な実装                                     |
| 認証                 | Firebase Authentication | ユーザー登録、ログイン、ログアウト               |
| データベース         | Firestore               | ユーザー、テナント、チャンネル、メッセージの管理 |
| 単体テスト           | Vitest                  | バリデーション、権限判定、データ整形処理のテスト |
| コンポーネントテスト | React Testing Library   | フォーム、一覧、表示制御のテスト                 |
| E2Eテスト            | Playwright              | 主要なユーザー操作のテスト                       |
| バージョン管理       | Git / GitHub            | ソースコードと設計ドキュメントの管理             |

## Next.js

Next.js は、アプリケーション全体のフレームワークとして使用する。

MVPでは、以下の役割を担う。

- ページルーティング
- 画面表示
- Reactコンポーネントの管理
- 認証状態に応じた画面制御
- Firebase Authentication との連携
- Firestore との連携
- 将来的なAPI実装やサーバー側処理への拡張

## React

React は、画面をコンポーネント単位で構築するために使用する。

MVPでは、以下のような単位でコンポーネントを分割する。

- ログインフォーム
- ユーザー登録フォーム
- チャンネル一覧
- チャンネル作成フォーム
- メッセージ一覧
- メッセージ投稿フォーム
- テナント情報表示
- 共通レイアウト

コンポーネント単位で分割することで、画面の見通しを良くし、テストしやすい構成にする。

## TypeScript

TypeScript は、アプリケーション全体の実装言語として使用する。

MVPでは、以下の目的で使用する。

- props や state の型を明確にする
- Firestore から取得するデータ構造を型で表現する
- ユーザー種別や権限の扱いを明確にする
- 実装時のミスを減らす
- コードの可読性と保守性を高める

主に以下のような型を定義する想定である。

```ts
type UserRole = 'admin' | 'member';

type AppUser = {
    id: string;
    displayName: string;
    email: string;
    tenantId: string;
    role: UserRole;
};

type Tenant = {
    id: string;
    name: string;
    joinCode: string;
    createdBy: string;
};

type Channel = {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    createdBy: string;
};

type Message = {
    id: string;
    tenantId: string;
    channelId: string;
    body: string;
    senderId: string;
    senderName: string;
};
```

## Firebase Authentication

Firebase Authentication は、ユーザー認証に使用する。

MVPでは、以下の機能を実装する。

- メールアドレスとパスワードによるユーザー登録
- メールアドレスとパスワードによるログイン
- ログアウト
- ログイン状態の取得
- 未ログインユーザーのアクセス制御

Firebase Authentication では認証情報を管理し、アプリ内で使用するユーザー名、所属テナント、ユーザー種別などは Firestore の `users` コレクションで管理する。

## Firestore

Firestore は、アプリ内データの管理に使用する。

MVPでは、以下のデータを管理する。

- ユーザー情報
- テナント情報
- チャンネル情報
- メッセージ情報

Firestore のコレクション構成は以下とする。

```text
users/{userId}

tenants/{tenantId}

tenants/{tenantId}/channels/{channelId}

tenants/{tenantId}/channels/{channelId}/messages/{messageId}
```

データ構造の詳細は `docs/05-data-model.md` に整理する。

## Firestore Security Rules

Firestore Security Rules は、認証状態や所属テナントに応じたアクセス制御に使用する。

MVPでは、以下を制御する。

- ログインしていないユーザーはデータを読み書きできない
- ユーザーは自分が所属するテナントのデータだけを参照できる
- ユーザーは所属テナント内のチャンネルだけを参照できる
- ユーザーは所属テナント内のメッセージだけを参照できる
- 管理者ユーザーだけがチャンネルを作成できる
- 一般ユーザーはチャンネル作成を行えない

画面上の表示制御だけでなく、データアクセスの制御も行うことで、業務用アプリとして必要な基本的な権限制御を示す。

## テストツール

MVPでは、以下の3種類のテストツールを使用する。

| テスト種別           | 使用ツール            | 主な対象                                               |
| -------------------- | --------------------- | ------------------------------------------------------ |
| 単体テスト           | Vitest                | バリデーション、権限判定、データ整形処理               |
| コンポーネントテスト | React Testing Library | フォーム、一覧、表示制御                               |
| E2Eテスト            | Playwright            | ユーザー登録、ログイン、チャンネル作成、メッセージ投稿 |

## Vitest

Vitest は、関数やロジックの単体テストに使用する。

主な対象は以下とする。

- メールアドレスのバリデーション
- 必須入力チェック
- メッセージ本文の空文字チェック
- ユーザー種別の判定
- チャンネル作成可否の判定
- Firestore保存用データの整形
- 表示用の日付変換

## React Testing Library

React Testing Library は、Reactコンポーネントのテストに使用する。

主な対象は以下とする。

- ログインフォームが正しく表示されること
- ユーザー登録フォームで登録方法に応じて入力欄が切り替わること
- 入力値に応じてエラーが表示されること
- 管理者ユーザーにだけチャンネル作成ボタンが表示されること
- 一般ユーザーに参加コードが表示されないこと
- メッセージ一覧に投稿者名、投稿日時、本文が表示されること

## Playwright

Playwright は、主要なユーザー操作のE2Eテストに使用する。

主な対象シナリオは以下とする。

- 管理者ユーザーが新規テナントを作成してログインする
- 管理者ユーザーがチャンネルを作成する
- 一般ユーザーが参加コードで既存テナントに参加する
- 一般ユーザーがメッセージを投稿する
- 一般ユーザーにチャンネル作成ボタンが表示されないことを確認する
- ログアウト後に認証後画面へアクセスできないことを確認する

詳細なテスト方針は `docs/08-test-policy.md` に整理する。

## Git / GitHub

Git と GitHub は、ソースコードと設計ドキュメントの管理に使用する。

MVPでは、以下を管理対象とする。

- アプリケーションコード
- README
- 設計ドキュメント
- テストコード
- 設定ファイル

設計ドキュメントを `docs/` 配下に管理することで、実装前に要件、スコープ、データ設計、画面設計を整理していることを示す。

## 機能と使用技術の対応

| 機能                 | 使用技術                                              |
| -------------------- | ----------------------------------------------------- |
| ユーザー登録         | Next.js / React / Firebase Authentication / Firestore |
| ログイン             | Next.js / React / Firebase Authentication             |
| ログアウト           | Firebase Authentication                               |
| 新規テナント作成     | Firestore                                             |
| 既存テナント参加     | Firestore                                             |
| 所属テナント情報表示 | Firestore                                             |
| チャンネル作成       | Firestore / Firestore Security Rules                  |
| チャンネル一覧表示   | Firestore                                             |
| チャンネル詳細表示   | Next.js / Firestore                                   |
| メッセージ投稿       | Firestore / Firestore Security Rules                  |
| メッセージ一覧表示   | Firestore                                             |
| 認証制御             | Firebase Authentication / Next.js                     |
| 権限制御             | Firestore / Firestore Security Rules / TypeScript     |
| 単体テスト           | Vitest                                                |
| コンポーネントテスト | React Testing Library                                 |
| E2Eテスト            | Playwright                                            |

## 採用しない技術・構成

MVPでは、以下の技術や構成は採用しない。

| 技術・構成          | 採用しない理由                                                         |
| ------------------- | ---------------------------------------------------------------------- |
| 独自バックエンドAPI | MVPでは Firebase を使い、認証とデータ管理をシンプルに構築するため      |
| PostgreSQL          | 今回は Firestore を採用し、MVPの実装速度とリアルタイム性を優先するため |
| Docker              | 初期MVPではローカル実行環境の複雑さを抑えるため                        |
| AWS本番構成         | 今回はアプリ設計、実装、テストに集中するため                           |
| 複雑なUIライブラリ  | MVPでは画面数が少なく、基本的なReact実装で十分なため                   |
| GraphQL             | MVPではデータ取得要件が単純であり、Firestore SDKで対応できるため       |
| Cloud Functions     | 初期MVPではサーバー側の独自処理を最小限にするため                      |

## 技術構成の全体像

```text
ユーザー
  ↓
Next.js / React / TypeScript
  ↓
Firebase Authentication
  ↓
Firestore
  ↓
Firestore Security Rules
```

## この構成で示したいこと

この技術構成では、以下を示すことを目的とする。

- React / Next.js を使ってWebアプリを実装できること
- TypeScript を使ってデータ構造を明確に扱えること
- Firebase Authentication を使って認証機能を実装できること
- Firestore を使って業務データを設計・管理できること
- テナント単位のデータ分離を考慮できること
- Firestore Security Rules による基本的なアクセス制御を考慮できること
- 単体テスト、コンポーネントテスト、E2Eテストを使い分けられること

## 完了条件

この技術構成は、以下を満たす状態で完了とする。

- 採用技術が明確である
- 各技術の役割が説明できる
- MVPの機能と使用技術の対応が説明できる
- 採用しない技術の理由が説明できる
- 実装時に必要な技術範囲が整理されている
- 転職用ポートフォリオとして、技術選定の意図を説明できる
