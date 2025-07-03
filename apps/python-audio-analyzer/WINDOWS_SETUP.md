# Windows環境での開発ガイド

## 概要

Windows環境でSonory Python Audio Analyzerを動作させる際の問題と解決方法について説明します。

## 主な問題

### 1. 日本語ユーザー名によるパス問題

**症状:**
```
ERROR: C:\Users\中村のPC\AppData\Local\Temp is not a directory
tensorflow.python.framework.errors_impl.FailedPreconditionError: C:\Users\中村のPC\AppData\Local\Temp is not a directory
```

**原因:**
- TensorFlow Hubが日本語文字を含むWindowsユーザー名のTempディレクトリを正しく処理できない
- 特に `\u4e2d\u6751` のような日本語文字が含まれるパス

**解決方法:**
本プロジェクトでは自動的にキャッシュディレクトリを安全な場所に設定する機能を実装しています。

## 自動修正機能

### YAMNetWrapperの自動修正

`src/models/yamnet_wrapper.py` に以下の機能が実装されています：

1. **安全なキャッシュディレクトリの設定**
   ```python
   def setup_tensorflow_hub_cache():
       # プロジェクトルートに tf_hub_cache ディレクトリを作成
       cache_dir = os.path.join(project_root, "tf_hub_cache")
       os.environ['TFHUB_CACHE_DIR'] = cache_dir
   ```

2. **再試行機能付きモデル読み込み**
   ```python
   def _load_model_with_retry(self):
       # 最大3回まで再試行
       # 指数バックオフ（2^n秒）で待機
   ```

3. **詳細なログ出力**
   - キャッシュディレクトリの状態
   - モデル読み込みの進行状況
   - エラーの詳細情報

## 手動セットアップ（必要な場合）

### PowerShellスクリプトの使用

#### 1. 問題修正スクリプト実行
```powershell
# 管理者権限でPowerShellを起動
cd C:\path\to\sonory\apps\python-audio-analyzer
powershell -ExecutionPolicy Bypass -File fix-windows-issues.ps1
```

#### 2. 環境変数設定
```powershell
# 生成されたスクリプトを実行
.\setup-env.ps1
```

#### 3. サーバー起動
```powershell
# 専用起動スクリプトを使用
.\start-server.ps1

# または手動起動
.\.venv\Scripts\Activate.ps1
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 環境変数の手動設定

必要に応じて以下の環境変数を設定してください：

```powershell
# TensorFlow Hubキャッシュディレクトリ
$env:TFHUB_CACHE_DIR = "C:\path\to\sonory\apps\python-audio-analyzer\tf_hub_cache"

# TensorFlowログレベル
$env:TF_CPP_MIN_LOG_LEVEL = "1"

# Pythonパス
$env:PYTHONPATH = "C:\path\to\sonory\apps\python-audio-analyzer\src"
```

## トラブルシューティング

### 1. 仮想環境の問題

**症状:**
```
'uvicorn' is not recognized as an internal or external command
```

**解決方法:**
```powershell
# 仮想環境をアクティブにする
.\.venv\Scripts\Activate.ps1

# 依存関係を再インストール
pip install -r requirements.txt
```

### 2. パッケージインストール問題

**症状:**
```
ERROR: Microsoft Visual C++ 14.0 is required
```

**解決方法:**
```powershell
# Build Tools for Visual Studio 2019をインストール
# または以下のコマンドでプリコンパイル済みパッケージを使用
pip install --only-binary=all tensorflow tensorflow-hub
```

### 3. メモリ不足エラー

**症状:**
```
ResourceExhaustedError: OOM when allocating tensor
```

**解決方法:**
```python
# TensorFlowメモリ増加制限を設定
import tensorflow as tf
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    tf.config.experimental.set_memory_growth(gpus[0], True)
```

## 開発環境の要件

### 必要なソフトウェア

1. **Python 3.9以上**
   - [python.org](https://www.python.org/downloads/)からダウンロード
   - "Add Python to PATH"を有効にする

2. **Git for Windows**
   - [git-scm.com](https://git-scm.com/download/win)からダウンロード

3. **Visual Studio Code（推奨）**
   - Python拡張機能をインストール

### 推奨な設定

#### PowerShell実行ポリシー
```powershell
# 管理者権限で実行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Git設定
```bash
git config --global core.autocrlf true
git config --global core.fileMode false
```

## パフォーマンス最適化

### 1. SSD使用の推奨
- TensorFlowモデルのキャッシュはSSDに保存
- HDDの場合、初回読み込みが非常に遅い

### 2. メモリ使用量の監視
```powershell
# タスクマネージャーで監視
# 8GB以上のRAMを推奨
```

### 3. 複数のPythonバージョンの管理
```powershell
# pyenv-win の使用を推奨
# https://github.com/pyenv-win/pyenv-win
```

## Docker環境での実行（推奨）

Windows環境での問題を回避するため、Docker使用を推奨します：

```powershell
# Docker Desktop for Windows をインストール
# https://www.docker.com/products/docker-desktop

# コンテナでの実行
docker-compose up --build
```

## 助けが必要な場合

1. **ログファイルの確認**
   ```powershell
   # 詳細ログを有効にして実行
   $env:LOG_LEVEL = "DEBUG"
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Issue報告**
   - エラーメッセージの全文
   - Windows バージョン
   - Python バージョン
   - 実行環境（仮想環境、Docker等）

3. **参考リンク**
   - [TensorFlow Windows インストールガイド](https://www.tensorflow.org/install/windows)
   - [Python Windows FAQ](https://docs.python.org/3/faq/windows.html)
   - [PowerShell 実行ポリシー](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy)

## 注意事項

- 本修正は日本語ユーザー名の問題を解決しますが、他の非ASCII文字でも同様の問題が発生する可能性があります
- セキュリティソフトウェアがPython実行を妨げる場合があります
- Windows DefenderのリアルタイムスキャンがPythonのパフォーマンスに影響する場合があります 