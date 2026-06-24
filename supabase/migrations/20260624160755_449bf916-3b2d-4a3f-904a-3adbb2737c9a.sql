
CREATE POLICY "anima-media public read" ON storage.objects FOR SELECT USING (bucket_id = 'anima-media');
CREATE POLICY "anima-media auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'anima-media');
CREATE POLICY "anima-media owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'anima-media' AND owner = auth.uid());
CREATE POLICY "anima-media owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'anima-media' AND owner = auth.uid());
