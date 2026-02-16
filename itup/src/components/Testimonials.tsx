"use client";

import { useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ReviewData {
  id: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
  mentor_name?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-accent" : "text-card-border"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation<HTMLElement>();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("reviews")
        .select("id, user_name, rating, content, created_at, mentor_id")
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        const mentorIds = [...new Set(data.map((r) => r.mentor_id).filter(Boolean))];
        let mentorMap: Record<string, string> = {};

        if (mentorIds.length > 0) {
          const { data: mentors } = await supabase
            .from("mentors")
            .select("id, name")
            .in("id", mentorIds);

          if (mentors) {
            mentorMap = Object.fromEntries(mentors.map((m) => [m.id, m.name]));
          }
        }

        setReviews(
          data.map((r) => ({
            id: r.id,
            user_name: r.user_name,
            rating: r.rating,
            content: r.content,
            created_at: r.created_at,
            mentor_name: r.mentor_id ? mentorMap[r.mentor_id] : undefined,
          }))
        );
      }

      setIsLoading(false);
    };

    fetchReviews();
  }, []);

  if (!isLoading && reviews.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`py-24 bg-background scroll-animate ${sectionVisible ? "visible" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            멘티 후기
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            실제 멘티들의 이야기
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            커피챗을 통해 성장한 멘티들의 생생한 후기를 확인해보세요.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card-bg border border-card-border rounded-2xl p-6">
                <div className="skeleton h-4 w-24 rounded mb-3" />
                <div className="skeleton h-4 w-full rounded mb-2" />
                <div className="skeleton h-4 w-3/4 rounded mb-4" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-card-bg border border-card-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <StarRating rating={review.rating} />
                <p className="mt-3 text-foreground leading-relaxed line-clamp-3">
                  {review.content}
                </p>
                <div className="mt-4 pt-4 border-t border-card-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{review.user_name}</p>
                    {review.mentor_name && (
                      <p className="text-xs text-muted mt-0.5">{review.mentor_name} 멘토</p>
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(review.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
