# 🔧 トラブルシューティング

## 📋 目次
- [Huskyのpre-commitエラー](#huskyのpre-commitエラー)
- [開発環境の問題](#開発環境の問題)
- [ビルド・リント関連](#ビルドリント関連)
- [Git操作関連](#git操作関連)

---

## Huskyのpre-commitエラー

### 🚨 症状
```bash
.husky/pre-commit: line 1: npm: command not found
husky - pre-commit script failed (code 127)
```

### 🔧 解決方法

#### 1. Node.jsの確認
```bash
node --version
npm --version
```

#### 2. Node.js管理ツール別の対処法

**🟢 NVM使用時：**
```bash
# .nvmrcファイルがある場合
nvm use

# または特定バージョンを使用
nvm use 18
```

**🔵 FNM使用時：**
```bash
fnm use
```

**🟡 Volta使用時：**
```bash
volta install node@18
```

#### 3. 環境別の設定例

**Linux/macOS with NVM:**
```bash
# .bashrc または .zshrc に追加
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

**Windows with NVM for Windows:**
```powershell
# PowerShellプロファイルに追加
$env:NVM_HOME = "$env:APPDATA\nvm"
$env:PATH += ";$env:NVM_HOME"
```

**Windows環境での注意点:**
- Git Bashまたは PowerShellを使用
- パスの区切り文字に注意
- 必要に応じて実行ポリシーを設定

### ✅ 対応済みNode.js管理ツール
- **NVM** (Node Version Manager) - Linux/macOS
- **FNM** (Fast Node Manager) - クロスプラットフォーム
- **Volta** - クロスプラットフォーム
- **直接インストール** - 各OS標準のパッケージマネージャー

---

## 開発環境の問題

### 1. 🚨 モジュールが見つからないエラー
```bash
Error: Cannot find module 'xxx'
```

**🔧 解決方法：**
```bash
# package-lock.jsonを削除して再インストール
rm package-lock.json
npm install

# または特定のモジュールを明示的にインストール
npm install xxx
```

### 2. 🚨 @sonory/shared-types が解決できないエラー
```bash
Could not resolve "@sonory/shared-types"
```

**🔧 解決方法：**
```bash
# モノレポの内部パッケージをビルド
npm install
npm run build

# または個別にshared-typesをビルド
cd packages/shared-types
npm run build
cd ../..

# それでも解決しない場合は、node_modulesをクリーンアップ
rm -rf node_modules packages/*/node_modules apps/*/node_modules
npm install
npm run build
```

---

## ビルド・リント関連

### 🚨 lint-stagedが実行されない
**🔧 解決方法：**
1. `package.json`の`lint-staged`設定を確認
2. 対象ファイルがステージされているか確認
3. 各ワークスペースでの設定が正しいか確認

### 🚨 TypeScriptエラーでコミットが失敗する
**🔧 解決方法：**
1. `npm run type-check`でエラーを確認
2. 各ワークスペースで`tsc --noEmit`を実行
3. 型エラーを修正してからコミット

### 🚨 Biomeのフォーマットエラー
**🔧 解決方法：**
1. `npm run fix`で自動修正を試行
2. 手動でコード品質を確認
3. 設定ファイル（`biome.json`）を確認

---

## Git操作関連

### 🚨 最新のmainブランチとの同期
**🔧 解決方法：**

1. **リモートの最新状態を取得**
```bash
git fetch origin main
```

2. **最新のmainブランチに自分の変更を上乗せ**
```bash
git pull --rebase origin main
```

3. **コンフリクトが発生した場合**
```bash
# コンフリクトを解決後
git add .
git rebase --continue
```

4. **リベース完了後、強制プッシュ**
```bash
# 注意：履歴が書き換わります
git push --force-with-lease origin feature/your-branch-name
```

---

## 💡 その他のヒント

### 🔍 デバッグ時の確認項目
1. Node.jsとnpmのバージョン確認
2. 環境変数の設定確認
3. ワークスペースの依存関係確認
4. ビルドログの確認

### 📞 サポートが必要な場合
- GitHub Issuesで問題を報告
- 開発チームメンバーに相談
- 設定ファイルの共有で問題を特定 