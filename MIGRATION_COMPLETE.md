# Sonory - モノレポ移行完了

このコミットで、ルートレベルの古いファイル構造からモノレポ構造への移行が完了しました。

## 移行されたファイル
- src/components → apps/web/src/components  
- 全てのコンポーネントファイルが新しい場所に移動
- 機能改善とコード品質向上も同時に適用

## 削除されたルートレベルファイル  
- src/components/molecules/WaveformPlayer/
- src/components/organisms/MapComponent/hooks/

