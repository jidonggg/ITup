-- 리뷰 시스템 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. reviews 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE CASCADE UNIQUE,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS reviews_mentor_id_idx ON public.reviews(mentor_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews(created_at DESC);

-- RLS 활성화
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 리뷰 조회 가능
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

-- 본인 리뷰만 작성 가능
CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 리뷰만 수정 가능
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인 리뷰 삭제 가능
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 관리자 전체 관리 가능 (service_role은 RLS 우회하므로 별도 정책 불필요)
-- 앱 내 관리자는 admin API에서 service_role key로 처리

-- ============================================
-- 2. 멘토 평점 자동 업데이트 트리거
-- ============================================

-- INSERT/UPDATE 용 함수
CREATE OR REPLACE FUNCTION public.update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mentors
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews
      WHERE mentor_id = NEW.mentor_id
    ), 0),
    reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE mentor_id = NEW.mentor_id
    )
  WHERE id = NEW.mentor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DELETE 용 함수 (OLD 참조 필요)
CREATE OR REPLACE FUNCTION public.update_mentor_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mentors
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews
      WHERE mentor_id = OLD.mentor_id
    ), 0),
    reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE mentor_id = OLD.mentor_id
    )
  WHERE id = OLD.mentor_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성: INSERT
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_rating();

-- 트리거 생성: UPDATE
DROP TRIGGER IF EXISTS on_review_updated ON public.reviews;
CREATE TRIGGER on_review_updated
  AFTER UPDATE OF rating ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_rating();

-- 트리거 생성: DELETE
DROP TRIGGER IF EXISTS on_review_deleted ON public.reviews;
CREATE TRIGGER on_review_deleted
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_rating_on_delete();

-- ============================================
-- 3. consultations에 리뷰 작성 여부 필드 추가
-- ============================================
ALTER TABLE public.consultations
ADD COLUMN IF NOT EXISTS has_review boolean DEFAULT false;
