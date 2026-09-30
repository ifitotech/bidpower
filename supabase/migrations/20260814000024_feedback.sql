-- BidPower — in-app feedback for the first user interviews.
-- A person can leave a comment from any screen and read back their own; the team reads them in the database.

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  page TEXT,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_company ON feedback(company_id, created_at DESC);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members leave feedback" ON feedback;
CREATE POLICY "Members leave feedback" ON feedback FOR INSERT WITH CHECK (user_id = auth.uid() AND company_id IN (SELECT get_user_company_ids()));
DROP POLICY IF EXISTS "People read their own feedback" ON feedback;
CREATE POLICY "People read their own feedback" ON feedback FOR SELECT USING (user_id = auth.uid());
