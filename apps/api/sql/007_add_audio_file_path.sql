-- sound_pinsテーブルにaudio_file_pathカラムを追加
-- 一時的な署名付きURLではなく、ストレージ内の永続的なファイルパスを保存するためのマイグレーション

-- 新しいカラムを追加（マイグレーションのため初期状態はNULL許可）
ALTER TABLE sound_pins
ADD COLUMN IF NOT EXISTS audio_file_path TEXT;

-- 既存のaudio_urlからファイルパス部分を抽出し、audio_file_pathに格納
-- 署名付きURL・公開URL両方に対応
UPDATE sound_pins
SET audio_file_path = (
    CASE
        -- 署名付きURL: /storage/v1/object/sign/sonory-audio/... のパス部分を抽出 → anonymous/2025-10-19/...
        WHEN audio_url LIKE '%/object/sign/sonory-audio/%' THEN
            regexp_replace(audio_url, '^.*/object/sign/sonory-audio/([^?]+).*$', '\1')
        -- 公開URL: /storage/v1/object/public/sonory-audio/... のパス部分を抽出 → anonymous/2025-10-19/...
        WHEN audio_url LIKE '%/object/public/sonory-audio/%' THEN
            regexp_replace(audio_url, '^.*/object/public/sonory-audio/([^?]+).*$', '\1')
        -- どちらにもマッチしない場合は元のURLをそのまま利用（フォールバック）
        ELSE audio_url
    END
)
WHERE audio_file_path IS NULL;

-- audio_file_path検索用のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_sound_pins_audio_file_path
ON sound_pins (audio_file_path);

-- カラムの用途を明記（コメント追加）
COMMENT ON COLUMN sound_pins.audio_file_path IS 'Supabase Storage内の永続ファイルパス（例: anonymous/2025-10-19/file.webm）。署名付きURL生成時に利用。';
COMMENT ON COLUMN sound_pins.audio_url IS '廃止予定: audio_file_pathから動的に署名付きURLを生成する構成へ移行予定。マイグレーション期間中は後方互換のため残す。';
