-- =============================================
-- Supabase Storage Policies for sonory-audio bucket
-- =============================================

-- 音声ファイルアップロード権限（認証不要）
CREATE POLICY "Anyone can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sonory-audio');

-- 音声ファイル読み取り権限（認証不要）
CREATE POLICY "Anyone can read audio files" ON storage.objects
FOR SELECT USING (bucket_id = 'sonory-audio');

-- 音声ファイル更新権限（認証不要）
CREATE POLICY "Anyone can update audio files" ON storage.objects
FOR UPDATE USING (bucket_id = 'sonory-audio');

-- 音声ファイル削除権限（認証不要）
CREATE POLICY "Anyone can delete audio files" ON storage.objects
FOR DELETE USING (bucket_id = 'sonory-audio');

-- バケット自体のアクセス権限
CREATE POLICY "Anyone can access sonory-audio bucket" ON storage.buckets
FOR SELECT USING (id = 'sonory-audio');

-- =============================================
-- 設定確認クエリ
-- =============================================

-- バケット存在確認
SELECT id, name, public FROM storage.buckets WHERE id = 'sonory-audio';

-- ポリシー確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND policyname LIKE '%audio%'; 