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
          className={`w-4 h-4 ${star <= rating ? "text-amber-500" : "text-card-border"}`}
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
      className={`py-28 bg-background scroll-animate ${sectionVisible ? "visible" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-primary/8 text-primary text-xs font-semibold tracking-widest uppercase rounded-full mb-5 border border-primary/10">
            Reviews
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            먼저 경험한 사람들의 한마디
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            &ldquo;진작 할 걸&rdquo; — 가장 많이 듣는 말입니다.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="premium-card rounded-2xl p-6">
                <div className="skeleton h-4 w-24 rounded mb-3" />
                <div className="skeleton h-4 w-full rounded mb-2" />
                <div className="skeleton h-4 w-3/4 rounded mb-4" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="premium-card rounded-2xl p-6"
              >
                {/* Quote mark */}
                <div className="text-primary/15 text-4xl font-serif leading-none mb-2">&ldquo;</div>
                <p className="text-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                  {review.content}
                </p>
                <StarRating rating={review.rating} />
                <div className="mt-4 pt-4 border-t border-card-border/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{review.user_name}</p>
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
