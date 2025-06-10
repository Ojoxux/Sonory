<div align="center">
  <img src="public/Sonory-App-Icon-PNG.png" width="360" alt="Sonory Logo">
  <h1>Sonory</h1>
  <p><strong>~ あなたの過ぎ去った10秒の軌跡を、地図に静かに印す ~</strong></p>
  
  <p>
    Sonoryは、あなたの周りの環境音を10秒間録音し、AIが自動分類してスタンプ化、地図上に記録するPWA対応のウェブアプリケーションです。<br>
    日常の一瞬を音で残します。
  </p>
</div>

## 🎵 Project Overview

### 主要機能
1. **環境音録音機能**
   - 10秒間の環境音を録音（MediaRecorder API使用）
   - 録音した音声の波形表示と再生（wavesurfer.js）

2. **AIによる音声分類**
   - TensorFlow.js（量子化YAMNet）によるオンデバイス音声分類
   - 録音した音に適切なラベルを自動付与

3. **スタンプ生成機能**
   - 音声ラベルに基づいた絵文字とカラーパレットの自動生成
   - 音の印象に合わせた視覚的なスタンプを作成

4. **地図へのスタンプ機能**
   - Mapbox v2 LTSを使用した地図表示
   - 録音した場所に自動生成されたスタンプを配置
   - スタンプのクラスタリング表示

5. **データ永続化機能**
   - Supabase Storageとstampsテーブルを使用
   - オフラインでも録音データを保持（IndexedDB）
   - 再接続時の自動同期（Background Sync API）

6. **コンテキスト情報の自動付与**
   - 時間帯（6時間区切り）の自動タグ付け
   - 天気情報の自動タグ付け（Open-Meteo API使用）

![Sonory App Screenshot](public/screenshot.png)

## 🚀 Getting Started

### 必要条件

- Node.js 20.0.0以上
- npm 10.0.0以上（または同等のyarn/pnpm/bun）
- Git

### 環境構築

1. リポジトリのクローン

```bash
git clone https://github.com/Ojoxux/Sonory.git
cd Sonory
```

2. 依存パッケージのインストール

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. 環境変数の設定

`.env.example`ファイルをコピーして`.env.local`を作成し、必要な環境変数を設定してください。

```bash
cp .env.example .env.local
```

4. 開発サーバーの起動

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

[http://localhost:3000](http://localhost:3000)をブラウザで開いて結果を確認できます。

## 🗂 Project Structure

```
sonory/
├── app/            # Next.js App Router
├── components/     # UIコンポーネント
│   ├── atoms/      # 最小単位のコンポーネント
│   ├── molecules/  # atomsの組み合わせ
│   ├── organisms/  # 複雑な機能を持つコンポーネント
│   └── templates/  # ページレイアウト
├── hooks/          # カスタムReactフック
├── lib/            # ユーティリティ関数
│   ├── ai/         # TensorFlow.js関連コード
│   ├── audio/      # 音声処理関連
│   ├── map/        # Mapbox関連
│   └── api/        # APIクライアント
├── public/         # 静的ファイル（PWA用アイコンなど）
│   ├── images/     # 画像ファイル
│   └── models/     # AI推論モデル
├── store/          # 状態管理関連のファイル
└── styles/         # グローバルスタイル
```

## 💻 Technical Stack

- **フレームワーク**: Next.js 15.3.2 (Turbopack使用)
- **UI**: React 19 + Chakra UI + Tailwind CSS v4
- **PWA**: next-pwa（サービスワーカー、オフライン対応）
- **音声処理**: MediaRecorder API + wavesurfer.js
- **AI推論**: TensorFlow.js + YAMNet（量子化モデル）
- **地図**: Mapbox GL JS v2
- **データ永続化**: Supabase + IndexedDB (idb)
- **状態管理**: Zustand 5.0.5
- **リンター/フォーマッター**: Biome 1.9.4
- **型システム**: TypeScript 5

## 🛠 Development Tools

```bash
# リント実行
npm run lint

# フォーマット実行
npm run format

# CI環境用リント
npm run ci

# 型チェック
npm run lint:typecheck
```

Huskyとlint-stagedを使用して、コミット前に自動的にリントとフォーマットが実行されます。

## 🏗 Build and Deploy

本番用ビルドの作成:

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun build
```

ビルド結果を確認:

```bash
npm run start
# or
yarn start
# or
pnpm start
# or
bun start
```

## 📝 Development Guidelines

### ブランチ命名規則

```
feature/i[issues番号]_hoge-fuga-hoge
```

例:
- `feature/i123_add-user-authentication`
- `bugfix/i456_fix-login-error`

### コミットメッセージ

- 英語、日本語どちらでも可
- プレフィックスを使用すること
- 機能やコンポーネントの種類に応じてスコープを括弧内に明示すること
- 絵文字の使用も可（特に録音・音声関連は🎤、音楽関連は🎵を使用）

```
feat(atoms): チェックマークアイコンコンポーネントと型定義を作成
feat(organisms): RecordingInterfaceに確認完了機能を追加
feat(MediaRecorder): 🎤 録音機能を強化し、一時停止・再開機能を追加
fix(molecules): 確認完了画面のアニメーション問題を修正
fix(WaveformPlayer): 音声再生時のシークバー動作を修正
style(organisms): AudioPlayback音声情報表記を削除
refactor(fonts): フォント設定を整理しArial Rounded MT Pro追加
remove(atoms): SelectAllButtonコンポーネントを削除
chore(deps): next-pwaをdependenciesに追加
```

**スコープの例:**
- **コンポーネント**: `(atoms)`, `(molecules)`, `(organisms)`
- **機能名**: `(MediaRecorder)`, `(WaveformPlayer)`, `(AudioPlayback)`, `(RecordingInterface)`
- **技術関連**: `(fonts)`, `(deps)`, `(biome)`

### プルリクエストタイトル記載ルール

- 日本語で記述すること
- 以下の形式で記載すること
- 機能やコンポーネントの種類に応じてスコープを括弧内に明示すること

```
feature(scope)/#[issues番号]: ほげほげ
fix(scope)/#[issues番号]: ほげほげ
style(scope)/#[issues番号]: ほげほげ
```

例:
- `feature(atoms)/#123: チェックマークアイコンコンポーネントの実装`
- `feature(organisms)/#124: RecordingInterface確認完了機能の追加`
- `fix(molecules)/#456: 確認完了画面のアニメーション問題修正`
- `fix(WaveformPlayer)/#457: 音声再生時のシークバー動作修正`
- `style(organisms)/#458: AudioPlayback音声情報表記の削除`
- `refactor(fonts)/#459: フォント設定の整理`

**スコープの例:**
- **コンポーネント**: `(atoms)`, `(molecules)`, `(organisms)`
- **機能名**: `(MediaRecorder)`, `(WaveformPlayer)`, `(AudioPlayback)`, `(RecordingInterface)`
- **技術関連**: `(fonts)`, `(deps)`, `(biome)`

- 注意: 変更の対象となる機能やコンポーネントの種類を括弧内に明記することで、変更の範囲と内容を明確にしてください。

## 🤝 Contribution Flow

1. Issueの確認・作成
   - 作業前に対応するIssueが存在することを確認
   - 存在しない場合は新規Issueを作成

2. ブランチの作成
   - ブランチ命名規則に従ったブランチを作成
   - `git checkout -b 'feature/i123_add-new-feature'`

3. 開発作業
   - 小さな単位でコミット
   - コミットメッセージ規則に従う

4. プルリクエスト作成
   - プルリクエストタイトル規則に従って作成
   - 関連するIssue番号を記載
   - 変更内容の概要を記載

5. コードレビュー
   - レビュアーからのフィードバックに対応
   - 必要に応じて修正コミットを追加

6. マージ
   - 承認後、マージを実行
   - Issueをクローズ

## 🔧 Troubleshooting

### よくある問題

1. **モジュールが見つからないエラー**
   ```bash
   # モジュールが見つからないエラーの場合
   Error: Cannot find module 'xxx'
   
   # 依存関係が正しくインストールされていない可能性があります
   # package-lock.jsonを削除して再インストール
   rm package-lock.json
   npm install
   
   # または特定のモジュールを明示的にインストール
   npm install xxx
   ```

2. **プルリクエスト作成時のコンフリクト**
   ```bash
   # mainブランチの最新変更を取り込み、自分の変更を上に乗せる
   git pull --rebase origin main
   
   # コンフリクトが発生した場合は解決後、以下のコマンドを実行
   git add .
   git rebase --continue
   
   # リベース完了後、強制プッシュ（注意：履歴が書き換わります）
   git push --force-with-lease origin feature/hoge-hoge
   ```