-- =============================================================================
-- Sonory スキーマスナップショット (SSOT)
-- =============================================================================
--
-- 生成日: 2026-09-15
-- 対象:   本番 Supabase プロジェクトの public スキーマ + Storage バケット
--
-- 【ここに書いてよいのは実DBで確認した事実だけです。】
--   スキーマを変更したいときは migrations/ に新しいファイルを追加して適用し、
--   そのあと実DBをダンプして本ファイルを突き合わせる。ここを直接書き換えても
--   実DBは変わらず、「ファイルと実DBの乖離」という過去に実害を出した状態に
--   逆戻りする。ダンプに無いものを書かないこと。手順は README を参照。
--
-- 位置づけ:
--   - **実DBが今どうなっているか**を1ファイルで読めるようにしたもの。
--     マイグレーションを順に読まなくても現在のスキーマ全体を把握できる。
--   - ダンプと突き合わせると、SQL Editor での直接変更などによる
--     乖離がそのまま差分として現れる。乖離検知の仕組みを兼ねる。
--   - 新規 Supabase プロジェクトを立ち上げる場合は、本ファイルを適用してから
--     migrations/ の未適用分を流す。
--
-- 対して migrations/ は「何をどう変えるか」の記録であり、適用される実体。
-- 本ファイルはその結果のスナップショットにすぎない。両者が食い違った場合、
-- 正しいのは実DBであり、本ファイルの更新が必要だという合図。
--
-- 更新の方法:
--   実DBをダンプし、それを正として本ファイルの該当箇所を書き換える。
--   ダンプをそのまま本ファイルにしないこと。postgis が public に入っているため
--   ダンプは6000行超のうち約2700行が st_* 関数への GRANT の羅列になる。
--   手順の詳細は README の「schema.sql の更新方法」を参照。
--
-- 経緯:
--   以前は apps/api/sql/001〜013 を手動で SQL Editor に貼る運用で、適用状態を
--   追跡する仕組みが無かった。その結果リポジトリと実DBが乖離し、
--   analysis_results テーブルや sound_pins.ai_analysis_result 列がリポジトリに
--   存在しない、逆に ai_* 6列はリポジトリにだけ残っている、関数の anon GRANT が
--   記録されていない、といった状態になっていた。
--   本ファイルは実DBを直接 introspect した結果のみに基づいて作られている。
--
-- 現在の状態:
--   認証 (Issue #117) の **DB 側は実装済み**。
--     - RLS は auth.uid() = user_id の所有権ベース
--     - create_sound_pin は SECURITY INVOKER で RLS が適用される
--     - sound_pins.user_id は auth.users(id) を ON DELETE SET NULL で参照
--   認証実装前に作成された孤児ピン（user_id IS NULL）が 2 件残っており、
--   閲覧のみ可能で編集・削除はできない。
--
--   user_id はクライアントに一切公開していない。RPC の戻り値から除外し、
--   テーブルに対しても列指定の GRANT で anon / authenticated から隠している。
--   所有者に基づく処理は API が service_role で行う。
--
--   アプリ側も API の認証ミドルウェアと Web の匿名サインイン
--   （Authorization ヘッダの自動付与を含む）まで実装済み。
--   通報は pin_reports への記録として実装済み。未実装は searchPins と
--   getUserPins のみ。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 拡張
-- -----------------------------------------------------------------------------
-- 既存プロジェクトではすべて導入済みのため、以下はいずれも no-op になる。
--
-- 【新規プロジェクトに適用する場合の注意】
-- 本番DBの実際の配置は postgis が public、pgmq が pgmq、uuid-ossp と pgcrypto が
-- extensions。素の CREATE EXTENSION で pgmq を入れると public に作ってしまい、
-- 本ファイルが前提とする pgmq_public.* / pgmq.meta の参照が壊れる。
-- 新規プロジェクトでは先に Dashboard の Database > Extensions から
-- postgis と pgmq を有効化し、そのうえで本ファイルを適用すること。
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 共通トリガー関数
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- -----------------------------------------------------------------------------
-- sound_pins: 位置情報付きの音声ピン
-- -----------------------------------------------------------------------------
-- 注意: 旧 002 が定義していた ai_transcription / ai_emotion / ai_topic /
-- ai_language / ai_confidence / ai_summary の6列は実DBには存在しない。
-- 解析結果は ai_analysis_result (JSONB) に一本化されている。
CREATE TABLE IF NOT EXISTS public.sound_pins (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 孤児ピン（認証実装前に作成されたもの）を残すため NULL 許可。
    -- auth.users(id) への外部キーはテーブル定義の後で ALTER により追加している
    -- （auth スキーマへの依存を CREATE TABLE から切り離すため）。
    user_id             UUID,

    location            GEOGRAPHY(POINT, 4326) NOT NULL,

    audio_url           TEXT NOT NULL,
    audio_file_path     TEXT,
    -- 上限は 11 秒。10秒録音に対する実測のブレを吸収するため
    -- 旧 010 で 10 から引き上げられた。
    audio_duration      REAL NOT NULL
                          CHECK (audio_duration > 0 AND audio_duration <= 11),
    audio_format        VARCHAR(10) NOT NULL
                          CHECK (audio_format IN ('webm', 'mp3', 'wav')),

    weather_temperature REAL,
    weather_condition   VARCHAR(50),
    weather_wind_speed  REAL,
    weather_humidity    REAL,
    time_tag            VARCHAR(10)
                          CHECK (time_tag IN ('朝', '昼', '夕', '夜')),

    -- YAMNet の解析結果。topic キーでのフィルタに使われる
    -- （find_pins_within_bounds の categories 引数）。
    ai_analysis_result  JSONB,

    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'processing', 'deleted', 'reported')),

    title               VARCHAR(200),
    device_info         TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sound_pins_location
    ON public.sound_pins USING GIST (location);

-- status='active' に絞った部分インデックス。地図表示のクエリが常に status で
-- 絞るため、全件の GIST より効率がよい。
CREATE INDEX IF NOT EXISTS idx_sound_pins_status_location
    ON public.sound_pins USING GIST (location)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sound_pins_created_at
    ON public.sound_pins (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sound_pins_status
    ON public.sound_pins (status);

CREATE INDEX IF NOT EXISTS idx_sound_pins_status_created
    ON public.sound_pins (status, created_at DESC)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sound_pins_user_id
    ON public.sound_pins (user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sound_pins_audio_file_path
    ON public.sound_pins (audio_file_path);

-- ai_analysis_result->>'topic' でのカテゴリ絞り込み用
CREATE INDEX IF NOT EXISTS idx_sound_pins_ai_analysis_result
    ON public.sound_pins USING GIN (ai_analysis_result);

DROP TRIGGER IF EXISTS update_sound_pins_updated_at ON public.sound_pins;
CREATE TRIGGER update_sound_pins_updated_at
    BEFORE UPDATE ON public.sound_pins
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_id の参照整合性。
-- ON DELETE SET NULL: ユーザーが退会してもピンは地図に残り、user_id = NULL の
-- 孤児ピンになる。孤児ピンは下の RLS ポリシー（auth.uid() = user_id）に
-- 合致しないため、自動的に読み取り専用になる。
-- 「日常の一瞬を音で残す」というプロダクトの性格上、退会でピンを消さない方針。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_sound_pins_user_id'
      AND conrelid = 'public.sound_pins'::regclass
  ) THEN
    ALTER TABLE public.sound_pins
      ADD CONSTRAINT fk_sound_pins_user_id
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- analysis_results: 非同期解析パイプラインの進行状態
-- -----------------------------------------------------------------------------
-- message_id は pgmq のメッセージID。リトライ時も最初のメッセージIDを
-- 引き継ぐ（apps/api/src/services/audio.service.ts の rootMessageId）ため、
-- 1つの解析ジョブに対して行は1つに保たれる。
CREATE TABLE IF NOT EXISTS public.analysis_results (
    message_id    BIGINT PRIMARY KEY,
    audio_id      TEXT NOT NULL,
    status        TEXT NOT NULL
                    CHECK (status IN ('processing', 'completed', 'failed')),
    result        JSONB,
    error_message TEXT,
    error_code    TEXT,
    retry_count   INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    metadata      JSONB
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_audio_id
    ON public.analysis_results (audio_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_status
    ON public.analysis_results (status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at
    ON public.analysis_results (created_at DESC);

-- -----------------------------------------------------------------------------
-- pin_reports: 通報記録
-- -----------------------------------------------------------------------------
-- 通報は status='reported' への更新ではなくここに記録する。前者は通報1回で
-- ピンが即座に公開範囲から消える状態だったため。
CREATE TABLE IF NOT EXISTS public.pin_reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin_id      UUID NOT NULL REFERENCES public.sound_pins(id) ON DELETE CASCADE,
    -- 通報者。退会しても通報記録は残す
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason      TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pin_reports_unique_reporter UNIQUE (pin_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_pin_reports_pin_id
    ON public.pin_reports (pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_reports_created_at
    ON public.pin_reports (created_at DESC);

-- 通報内容は運営のみが読む。ポリシーを作らないことで anon / authenticated に
-- 対する既定拒否とし、service_role のみが読み書きする（analysis_results と同じ形）
ALTER TABLE public.pin_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pin_reports FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.pin_reports TO service_role;

-- -----------------------------------------------------------------------------
-- RPC: ピン作成
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER である点に注意。この関数経由の INSERT には RLS が適用されない。
-- 所有者の検証は 20260912071029_auth_schema.sql で SECURITY INVOKER 化して解消する。
-- p_ai_analysis_result は 20260914115424 で末尾に追加された（DEFAULT NULL のため
-- 既存の呼び出しに影響なし）。分類結果（YAMNet）をピン作成と同時に保存する。
CREATE OR REPLACE FUNCTION public.create_sound_pin(
  p_user_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_audio_url TEXT,
  p_audio_duration REAL,
  p_audio_format VARCHAR(10),
  p_weather_temperature REAL DEFAULT NULL,
  p_weather_condition VARCHAR(50) DEFAULT NULL,
  p_weather_wind_speed REAL DEFAULT NULL,
  p_weather_humidity REAL DEFAULT NULL,
  p_time_tag VARCHAR(10) DEFAULT NULL,
  p_title VARCHAR(200) DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL,
  p_audio_file_path TEXT DEFAULT NULL,
  p_ai_analysis_result JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID, location TEXT, audio_url TEXT, audio_file_path TEXT,
  audio_duration REAL, audio_format VARCHAR(10),
  weather_temperature REAL, weather_condition VARCHAR(50),
  weather_wind_speed REAL, weather_humidity REAL,
  time_tag VARCHAR(10), ai_analysis_result JSONB, status VARCHAR(20),
  title VARCHAR(200), device_info TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
-- SECURITY INVOKER。呼び出し元の権限で実行されるため RLS が適用され、
-- p_user_id != auth.uid() の INSERT は INSERT ポリシーに拒否される。
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  new_pin_id UUID;
BEGIN
  INSERT INTO public.sound_pins (
    user_id, location, audio_url, audio_file_path, audio_duration, audio_format,
    weather_temperature, weather_condition, weather_wind_speed, weather_humidity,
    time_tag, title, device_info, ai_analysis_result, status
  ) VALUES (
    p_user_id,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_audio_url, p_audio_file_path, p_audio_duration, p_audio_format,
    p_weather_temperature, p_weather_condition, p_weather_wind_speed,
    p_weather_humidity, p_time_tag, p_title, p_device_info, p_ai_analysis_result,
    'active'
  )
  RETURNING public.sound_pins.id INTO new_pin_id;

  RETURN QUERY
  SELECT
    sp.id, ST_AsText(sp.location::geometry) AS location,
    sp.audio_url, sp.audio_file_path, sp.audio_duration, sp.audio_format,
    sp.weather_temperature, sp.weather_condition, sp.weather_wind_speed,
    sp.weather_humidity, sp.time_tag, sp.ai_analysis_result, sp.status,
    sp.title, sp.device_info, sp.created_at, sp.updated_at, sp.deleted_at
  FROM public.sound_pins sp
  WHERE sp.id = new_pin_id;
END;
$function$;

-- -----------------------------------------------------------------------------
-- RPC: 近傍検索（半径指定）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_nearby_pins(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID, location TEXT, audio_url TEXT, audio_file_path TEXT,
  audio_duration REAL, audio_format VARCHAR(10),
  weather_temperature REAL, weather_condition VARCHAR(50),
  weather_wind_speed REAL, weather_humidity REAL,
  time_tag VARCHAR(10), ai_analysis_result JSONB, status VARCHAR(20),
  title VARCHAR(200), device_info TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    sp.id, ST_AsText(sp.location::geometry) AS location,
    sp.audio_url, sp.audio_file_path, sp.audio_duration, sp.audio_format,
    sp.weather_temperature, sp.weather_condition, sp.weather_wind_speed,
    sp.weather_humidity, sp.time_tag, sp.ai_analysis_result, sp.status,
    sp.title, sp.device_info, sp.created_at, sp.updated_at, sp.deleted_at,
    ST_Distance(
      sp.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_meters
  FROM public.sound_pins sp
  WHERE
    sp.status = 'active'
    AND ST_DWithin(
      sp.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT max_results;
END;
$function$;

-- -----------------------------------------------------------------------------
-- RPC: 矩形範囲検索（地図のビューポート）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_pins_within_bounds(
  north DOUBLE PRECISION,
  south DOUBLE PRECISION,
  east DOUBLE PRECISION,
  west DOUBLE PRECISION,
  max_results INTEGER DEFAULT 50,
  categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID, location TEXT, audio_url TEXT, audio_file_path TEXT,
  audio_duration REAL, audio_format VARCHAR(10),
  weather_temperature REAL, weather_condition VARCHAR(50),
  weather_wind_speed REAL, weather_humidity REAL,
  time_tag VARCHAR(10), ai_analysis_result JSONB, status VARCHAR(20),
  title VARCHAR(200), device_info TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    sp.id, ST_AsText(sp.location::geometry) AS location,
    sp.audio_url, sp.audio_file_path, sp.audio_duration, sp.audio_format,
    sp.weather_temperature, sp.weather_condition, sp.weather_wind_speed,
    sp.weather_humidity, sp.time_tag, sp.ai_analysis_result, sp.status,
    sp.title, sp.device_info, sp.created_at, sp.updated_at, sp.deleted_at
  FROM public.sound_pins sp
  WHERE
    sp.status = 'active'
    AND sp.location && ST_MakeEnvelope(west, south, east, north, 4326)
    AND ST_Within(sp.location::geometry, ST_MakeEnvelope(west, south, east, north, 4326))
    AND (categories IS NULL OR (sp.ai_analysis_result->>'topic') = ANY(categories))
  ORDER BY sp.created_at DESC
  LIMIT max_results;
END;
$function$;

-- -----------------------------------------------------------------------------
-- RPC: pgmq ラッパー（解析キュー）
-- -----------------------------------------------------------------------------
-- サーバ内部の解析パイプライン専用。クライアントから呼べてはならないため、
-- 末尾の権限設定で anon / authenticated から EXECUTE を剥奪している。
CREATE OR REPLACE FUNCTION public.queue_send(
  queue_name TEXT, message JSONB, sleep_seconds INTEGER DEFAULT 0
)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT pgmq_public.send(queue_name, message, sleep_seconds);
$function$;

CREATE OR REPLACE FUNCTION public.queue_read(
  queue_name TEXT, sleep_seconds INTEGER, n INTEGER
)
RETURNS TABLE(
  msg_id BIGINT, read_ct INTEGER, enqueued_at TIMESTAMPTZ,
  vt TIMESTAMPTZ, message JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT * FROM pgmq_public.read(queue_name, sleep_seconds, n);
$function$;

CREATE OR REPLACE FUNCTION public.queue_delete(
  queue_name TEXT, message_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT pgmq_public.delete(queue_name, message_id);
$function$;

-- -----------------------------------------------------------------------------
-- pgmq キュー
-- -----------------------------------------------------------------------------
-- 音声解析ジョブのキュー。pgmq.create は冪等ではないため存在確認してから作る。
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pgmq.meta WHERE queue_name = 'audio-analysis') THEN
    PERFORM pgmq.create('audio-analysis');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RLS: sound_pins
-- -----------------------------------------------------------------------------
-- 所有権ベース。書き込みは authenticated かつ auth.uid() = user_id の場合のみ。
--
-- 孤児ピン（user_id IS NULL）は UPDATE/DELETE のポリシーに合致しないため、
-- 構造的に読み取り専用になる。特別な分岐は不要。
--
-- create_sound_pin は SECURITY INVOKER なので、この INSERT ポリシーが
-- RPC 経由の作成にも適用される。p_user_id に他人の UUID を渡しても拒否される。
ALTER TABLE public.sound_pins ENABLE ROW LEVEL SECURITY;

-- 20260913145717 で所有者は非公開状態（processing/deleted 等）でも自分のピンを
-- 見られるように緩めた。緩めないと論理削除（UPDATE で status='deleted'）の
-- RETURNING が RLS に弾かれ DELETE /api/pins/{id} が 500 になっていた。
DROP POLICY IF EXISTS "Public pins are viewable by everyone" ON public.sound_pins;
CREATE POLICY "Public pins are viewable by everyone"
  ON public.sound_pins FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pins" ON public.sound_pins;
CREATE POLICY "Users can insert their own pins"
  ON public.sound_pins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pins" ON public.sound_pins;
CREATE POLICY "Users can update their own pins"
  ON public.sound_pins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pins" ON public.sound_pins;
CREATE POLICY "Users can delete their own pins"
  ON public.sound_pins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS: analysis_results
-- -----------------------------------------------------------------------------
-- 解析パイプラインの内部状態であり、クライアントからは一切参照されない
-- （Realtime の購読対象は sound_pins のみ）。
-- ポリシーを1つも作らないことで anon / authenticated に対する既定拒否とし、
-- service_role は RLS をバイパスして読み書きする。
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 権限
-- -----------------------------------------------------------------------------
-- Supabase の既定では public スキーマの全テーブルに GRANT ALL が付与されるため、
-- 明示的に絞り直す。実際の行レベル制御は上記の RLS が行う。
REVOKE ALL ON public.sound_pins FROM PUBLIC, anon, authenticated;
-- SELECT は列指定。user_id を除外して所有者 UUID をクライアントに見せない。
-- 見えると位置と時刻からピンを束ねられ、特定個人の行動範囲を推測できるため。
--
-- ⚠️ 列指定の GRANT は列挙した列だけが対象。sound_pins に列を追加した場合、
-- ここに追記しない限り anon / authenticated からは読めない。
-- 安全側に倒れる（追加列はデフォルト非公開）が、機能が動かない原因になりうる。
--
-- 副作用: これらのロールは sound_pins でワイルドカードを使えなくなる。
-- PostgREST の /rest/v1/sound_pins?select=* はエラーになり、列名の明示が必要。
-- アプリの読み取りは SECURITY DEFINER の RPC 経由なので影響を受けない。
GRANT SELECT (
   id,
   location,
   audio_url,
   audio_file_path,
   audio_duration,
   audio_format,
   weather_temperature,
   weather_condition,
   weather_wind_speed,
   weather_humidity,
   time_tag,
   ai_analysis_result,
   status,
   title,
   device_info,
   created_at,
   updated_at,
   deleted_at
) ON public.sound_pins TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sound_pins TO authenticated;
GRANT ALL ON public.sound_pins TO service_role;

REVOKE ALL ON public.analysis_results FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.analysis_results TO service_role;

-- 検索系 RPC は未ログインのゲストが地図を閲覧するための正規経路。
-- status = 'active' の行しか返さないため anon に開放してよい。
GRANT EXECUTE ON FUNCTION public.find_nearby_pins(
  double precision, double precision, integer, integer
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.find_pins_within_bounds(
  double precision, double precision, double precision, double precision,
  integer, text[]
) TO anon, authenticated, service_role;

-- ピン作成は認証済みユーザーのみ。anon から呼べると SECURITY DEFINER と
-- 組み合わさって未認証の第三者が任意名義のピンを作成できてしまう。
REVOKE EXECUTE ON FUNCTION public.create_sound_pin(
  uuid, double precision, double precision, text, real, character varying,
  real, character varying, real, real, character varying, character varying,
  text, text, jsonb
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sound_pin(
  uuid, double precision, double precision, text, real, character varying,
  real, character varying, real, real, character varying, character varying,
  text, text, jsonb
) TO authenticated, service_role;

-- キュー操作はサーバ内部専用。
REVOKE EXECUTE ON FUNCTION public.queue_send(text, jsonb, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_read(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_delete(text, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_send(text, jsonb, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_read(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_delete(text, bigint) TO service_role;

-- -----------------------------------------------------------------------------
-- Storage
-- -----------------------------------------------------------------------------
-- 非公開バケット。アプリは createSignedUrl でのみURLを発行しており
-- （audio.service.ts / pin.repository.ts）、getPublicUrl は使用していない。
-- 署名付きURLは非公開バケットでも機能するため再生に影響しない。
--
-- storage.objects にポリシーを作らないことで anon / authenticated を既定拒否とし、
-- アップロードと削除は service_role（AudioService の getSupabaseAdmin 経由）
-- だけが行える状態にする。
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sonory-audio',
  'sonory-audio',
  false,
  10485760,  -- 10MB
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg',
        'audio/wav', 'audio/x-wav', 'audio/wave']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
-- supabase_realtime publication は存在していたが、テーブルが1つも登録されて
-- おらず postgres_changes の購読が一切配信されていなかった（20260914094720）。
-- Web は INSERT（新規ピンの即時表示）と UPDATE（解析結果の書き戻し）を購読する
-- （useRealtimeStore.ts）。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sound_pins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sound_pins;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- マイグレーション履歴への記録
-- -----------------------------------------------------------------------------
-- 本ファイルは SQL Editor への貼り付けでも適用できるが、
-- Supabase CLI (supabase db push) に切り替えた際に「適用済み」と認識されるよう、
-- CLI が参照する履歴テーブルに自身を登録しておく。
-- これにより、SQL Editor 運用から CLI 運用への移行時に再適用が起きない。
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version    TEXT PRIMARY KEY,
  statements TEXT[],
  name       TEXT
);

-- このスナップショットを生成した時点で適用済みのマイグレーションを登録する。
-- 本ファイルはこれらの効果をすべて含んでいるため、ここから構築した新規DBで
-- 再適用されないようにする。
--
-- 20260607000001 は Better Auth 導入を巻き戻した旧ファイル。内容は本スナップショットに
-- 反映済み。TRUNCATE TABLE sound_pins を含むため、未登録のまま supabase db push を
-- 実行するとデータが消える。ファイル自体は削除済みだが、git 履歴から復元された
-- 場合に備えて登録しておく。
--
-- 未適用のマイグレーションはここに含めないこと。
-- 含めると、本ファイルから構築した新規DBにそれらが適用されなくなる。
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260607000001', 'reset_auth_schema_to_pre_auth'),
  ('20260912071028', 'auth_rls_policies'),
  ('20260912071029', 'auth_schema'),
  ('20260912113306', 'hide_user_id_from_clients'),
  ('20260912113856', 'restrict_user_id_column'),
  ('20260913145717', 'owner_can_see_own_pins'),
  ('20260913150549', 'create_pin_reports'),
  ('20260914094720', 'enable_realtime_for_sound_pins'),
  ('20260914115424', 'create_sound_pin_accepts_analysis')
ON CONFLICT (version) DO NOTHING;
