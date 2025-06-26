# Sonory実装ガイド - 実際に詰まった問題と解決策

## 📋 概要
Sonory音声録音・AI分析・地図ピン配置アプリの実装で**実際に発生した問題**と**具体的な解決策**をまとめたドキュメント。  
「動くはずなのに動かない」問題を中心に、マイクロサービス構成での典型的な課題と対処法を記録しています。

**技術スタック**: Next.js + Cloudflare Workers + Python YAMNet + Supabase  
**開発期間**: 2024年12月  
**構成**: フロントエンド(3000) + API Gateway(8787) + Python分析(8000) + Supabase

---

## 🚨 最重要課題：初回統合時の大混乱

### 状況
4つのサービス（Next.js、API Gateway、Python分析、Supabase）を初めて統合した時の話。
個別には動作していたが、統合すると全く動かない状態に。

### 心理的プロセス
```
😰 「動くかな...?」
😱 「404エラー連発！」
😵 「環境変数がundefined？」
🤯 「Python分析サービスが見つからない！」
🧐 「一つずつ確認しよう...」
😌 「やっと全部動いた！」
```

### 根本問題
- **統合テスト不足**: 各サービス個別動作 ≠ 統合動作
- **設定の分散**: サービスごとに異なる設定方法
- **依存関係の複雑さ**: 1つ止まると全体停止

### 学習ポイント
**複雑なシステムは段階的統合が必須**。一度に全部動かそうとするのは無謀。

---

## 🔧 具体的な問題と解決策

### 1. Next.js → API Gateway 404エラー

#### 🚫 問題
```javascript
fetch('/api/audio/upload', { method: 'POST', body: formData })
// ↓ 404 Not Found
```

#### 🔍 原因
- Next.jsの `/api/` ルートと外部APIの混同
- プロキシ設定不足

#### ✅ 解決策
```typescript
// apps/web/next.config.ts
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8787/api/:path*', // API Gatewayにプロキシ
    },
  ]
}
```

#### 🛠️ デバッグ手法
```bash
# 1. ブラウザDevToolsのNetworkタブで実際のリクエスト先確認
# 2. API Gateway直接テスト
curl http://localhost:8787/api/health

# 3. 段階的確認
# フロントエンド → プロキシ → バックエンド
```

---

### 2. Cloudflare Workers環境変数地獄

#### 🚫 問題
```javascript
console.log(env.SUPABASE_URL) // undefined
```

#### 🔍 原因
- `.env`ファイルではなく`.dev.vars`が必要
- `--env development`フラグ不足

#### ✅ 解決策
```bash
# 1. .dev.vars ファイル作成
# apps/api/.dev.vars
SUPABASE_URL=https://chwhldradyylmltutudm.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
PYTHON_AUDIO_ANALYZER_URL=http://localhost:8000
```

```bash
# 2. 起動コマンド修正
wrangler dev src/index.ts --env development --port 8787
```

#### 💡 教訓
プラットフォーム固有の設定方法は、公式ドキュメントに従う。推測は危険。

---

### 3. Python依存関係の連鎖エラー

#### 🚫 問題
```bash
ModuleNotFoundError: No module named 'resampy'
# ↓ 解決後
ModuleNotFoundError: No module named 'librosa'  
# ↓ さらに...
Error loading YAMNet model...
```

#### 🔍 原因
- 音声処理ライブラリの依存関係が複雑
- WebM処理に必要な`ffmpeg-python`不足

#### ✅ 解決策
```toml
# apps/python-audio-analyzer/pyproject.toml
[tool.poetry.dependencies]
python = "^3.9"           # 3.11から緩和
ffmpeg-python = "^0.2.0"  # WebM変換
resampy = "^0.4.2"        # リサンプリング
librosa = "^0.10.1"       # 音響解析
```

```bash
cd apps/python-audio-analyzer
poetry install --no-dev
```

#### 💡 教訓
Python環境は`poetry install`で統一管理。個別pip installは混乱の元。

---

### 4. Blob URL → サーバーアクセス不可問題

#### 🚫 問題
```javascript
// フロントエンド
const audioUrl = "blob:http://localhost:3000/32fb95ec-..."

// バックエンド
fetch(audioUrl) // ❌ アクセスできない！
```

#### 🔍 原因
ブラウザのBlob URLは**ローカルスコープ**でのみ有効

#### ✅ 解決策
```typescript
// apps/web/src/store/useInferenceStore.ts
async function uploadAudioToStorage(audioData: AudioData): Promise<string> {
   // 1. FormData作成
   const formData = new FormData()
   formData.append('audio', audioData.blob, `audio-${audioData.id}.webm`)

   // 2. Supabase Storageにアップロード
   const response = await fetch('/api/audio/upload', {
      method: 'POST',
      body: formData,
   })

   // 3. 公開URLを取得（これならバックエンドからアクセス可能）
   const result = await response.json()
   return result.data.audioUrl
}
```

#### 📊 データフロー図
```
ブラウザ録音 → Blob作成 → FormData → Supabase Storage → 公開URL → バックエンドAPI
```

#### 💡 教訓
ブラウザとサーバーの境界を明確に理解する。データフローを図で描くと分かりやすい。

---

### 5. YAMNet分析結果の謎

#### 🚫 問題
```json
{
  "label": "その他: index,mid,display_name",
  "confidence": 0.007695633452385664  // 0.77%...?
}
```

#### 🔍 原因分析
1. **CSVパース問題**: クラスマップファイルを正しく読めていない
2. **マッピング不足**: AudioSet→日本語変換が不完全
3. **閾値設定**: 分析結果の信頼度判定が厳しすぎ

#### ✅ 段階的解決

**Step 1: デバッグ情報追加**
```python
# 音声データ統計
audio_stats = {
    "max_amplitude": float(np.max(np.abs(audio_waveform))),
    "rms_energy": float(np.sqrt(np.mean(audio_waveform**2))),
    "duration_seconds": len(audio_waveform) / sample_rate,
}

# 推論結果統計
score_stats = {
    "max_score": float(np.max(mean_scores)),
    "scores_above_1percent": int(np.sum(mean_scores > 0.01)),
}
```

**Step 2: CSVパース修正**
```python
def _load_class_names(self, class_map_path: str) -> List[str]:
    class_names = []
    with tf.io.gfile.GFile(class_map_path) as f:
        for line in f.readlines():
            parts = line.strip().split(',', 2)  # index,mid,display_name
            if len(parts) >= 3:
                display_name = parts[2].strip().strip('"')  # ★重要
                class_names.append(display_name)
    return class_names
```

**Step 3: マッピング大幅拡張**
```python
AUDIOSET_TO_JAPANESE = {
    "Air conditioning": "エアコンの音",
    "Inside, large room or hall": "室内音",
    "Laughter": "笑い声",
    "Human voice": "人の声",
    # 100以上のクラスを追加...
}
```

**Step 4: 閾値調整**
```python
# 0.5% → 0.1% に緩和して、より多くの結果を表示
if score < 0.001:
    continue
```

#### 💡 教訓
AI分析の「精度が低い」問題は、モデルではなく**後処理**が原因であることが多い。

---

### 6. npmスクリプト統合の複雑さ

#### 🚫 問題
3つのサービスを毎回手動起動するのが面倒
```bash
# 毎回手動実行...😰
cd apps/python-audio-analyzer && python3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 &
cd ../api && wrangler dev --env development --port 8787 &  
cd ../web && npm run dev &
```

#### ✅ 解決策
```json
// package.json
{
  "scripts": {
    "start:all": "concurrently \"npm run start:python\" \"npm run start:api\" \"npm run start:frontend\" --names \"🐍Python,🔗API,📱Frontend\" --prefix-colors \"yellow,blue,green\"",
    "start:python": "cd apps/python-audio-analyzer && python3 -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000",
    "start:api": "cd apps/api && wrangler dev src/index.ts --env development --port 8787",
    "start:frontend": "cd apps/web && npm run dev",
    "stop:all": "pkill -f 'next|wrangler|uvicorn' || echo 'All services stopped'"
  }
}
```

#### 🎯 最終的な使用感
```bash
# 開発開始
npm run start:all

# 美しい出力 ✨
[🐍Python] INFO: Started server process [12345]
[🔗API] ⛅️ wrangler 3.97.0  
[📱Frontend] ▲ Next.js 15.3.2

# 開発終了
npm run stop:all
```

#### 💡 教訓
開発体験（DX）は生産性に直結。面倒な作業は早めに自動化する。

---

## 📊 問題パターン分析

### 発生タイミング別
- **初期設定** (40%): 環境変数、依存関係、プロキシ設定
- **サービス統合** (35%): API通信、データフロー、認証  
- **AI処理最適化** (25%): モデル実装、結果後処理

### 影響度別
- **🔴 Critical**: プロキシ設定、環境変数 → アプリ全体停止
- **🟡 Major**: 音声処理、AI分析 → 機能制限
- **🟢 Minor**: ログ出力、UI調整 → UX影響

### 解決難易度別  
- **😅 Easy**: 環境変数、依存関係 → 設定ファイル修正
- **🤔 Medium**: プロキシ設定、形式変換 → コード修正
- **😰 Hard**: AI後処理、マッピング → ドメイン知識 + 実装

---

## 🛡️ 予防策・ベストプラクティス

### 開発環境セットアップチェックリスト
```bash
# ✅ 必須設定ファイル
- [ ] apps/api/.dev.vars (Cloudflare Workers環境変数)
- [ ] apps/web/.env.local (Next.js環境変数)  
- [ ] apps/python-audio-analyzer/pyproject.toml (Python依存関係)
- [ ] apps/web/next.config.ts (プロキシ設定)

# ✅ サービス起動確認
curl http://localhost:3000      # フロントエンド
curl http://localhost:8787/api/health  # API Gateway
curl http://localhost:8000/health      # Python分析

# ✅ 統合テスト
npm run start:all
# 全サービスの動作確認後
npm run stop:all
```

### デバッグツールセット
```bash
# ネットワーク・プロセス確認
lsof -i :3000,8787,8000
ps aux | grep -E "(next|wrangler|uvicorn)" | grep -v grep

# API直接テスト
curl -X POST "http://localhost:8787/api/audio/upload" -F "audio=@test.webm"
curl "http://localhost:8000/api/v1/analyze/audio" -d '{"audio_url":"..."}'

# セキュリティ・依存関係チェック
npm audit
npm outdated
```

### エラーハンドリング戦略
```typescript
// 段階的フォールバック
async function processAudio(audioData: AudioData) {
  try {
    // 1. バックエンドAPI呼び出し
    return await callBackendAnalysis(audioData)
  } catch (backendError) {
    console.warn('🔄 バックエンド失敗、ローカル処理に切り替え')
    // 2. ローカルフォールバック
    return generateLocalAnalysis(audioData)
  }
}
```

---

## ✨ 最重要な学習ポイント

### 「動くはずなのに動かない」対処法
1. **仮定を疑う**: 「当然動くはず」を捨てる
2. **段階的検証**: 各レイヤーを個別確認  
3. **ログを読む**: エラーメッセージは正確な情報源
4. **外部ツール活用**: curl、DevTools、ps/lsof
5. **最小再現**: 問題を最小構成で再現

### マイクロサービス開発の現実
- **統合は難しい**: 個別動作 ≠ 統合動作
- **設定が9割**: コードより設定で詰まる
- **依存関係地獄**: 1つ止まると全体停止  
- **環境差分カオス**: サービスごとに違う設定方法
- **デバッグ困難**: どこで止まってるか分からない

### 成功の秘訣
- **ツールを信じる**: エラーメッセージ・デバッガ・audit結果
- **自動化投資**: 手作業は必ずミスる  
- **記録重要**: 同じ問題で二度詰まらない
- **段階的構築**: 複雑さを受け入れて、確実に積み上げる

---

## 🎯 今後の改善課題

### 技術的改善  
- [ ] **CI/CD統合**: GitHub Actionsでの自動テスト
- [ ] **監視強化**: 各サービスのヘルスチェック自動化
- [ ] **性能最適化**: AI分析の高速化・キャッシュ導入
- [ ] **エラー追跡**: Sentry等の本格的監視ツール導入

### 開発プロセス改善
- [ ] **統合テスト**: サービス間連携の自動テスト
- [ ] **設定管理**: 環境別設定の統一化
- [ ] **ドキュメント**: API仕様書の継続更新
- [ ] **レビュー**: マイクロサービス設計の定期見直し

---

**作成日**: 2024年12月  
**最終更新**: 2024年12月  
**対象**: Sonory音声録音・AI分析・地図アプリ  
**教訓**: 複雑なシステムは段階的に、ツールを活用して確実に構築する

**このドキュメントがマイクロサービス開発で詰まった時の道標になれば幸いです 🗺️** 