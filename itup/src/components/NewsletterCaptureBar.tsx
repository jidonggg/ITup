"use client";

import { useState, useEffect, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterCaptureBar() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("newsletterSubscribed")) return;
    setHidden(false);
  }, []);

  if (hidden) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email: email.trim(), subscribed_at: new Date().toISOString() });

      if (error) {
        // Supabase returns code 23505 for unique constraint violations
        if (error.code === "23505") {
          setStatus("duplicate");
          return;
        }
        throw error;
      }

      localStorage.setItem("newsletterSubscribed", "true");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="bg-gradient-to-r from-primary/5 to-accent/5 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-primary font-medium">
              구독 완료! 곧 유용한 정보를 보내드릴게요.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (status === "duplicate") {
    return (
      <section className="bg-gradient-to-r from-primary/5 to-accent/5 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-primary font-medium">이미 구독 중이에요!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-primary/5 to-accent/5 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">
            게임 업계 취업 꿀팁 받아보기
          </h2>
          <p className="text-sm text-muted mt-1">
            채용 시즌 정보, 면접 팁, 포트폴리오 가이드를 이메일로 받아보세요
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex justify-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소를 입력하세요"
            className="w-full max-w-sm rounded-l-full border border-r-0 border-card-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-primary text-white rounded-r-full px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {status === "loading" ? "..." : "구독"}
          </button>
        </form>
        {status === "error" && (
          <p className="text-center text-sm text-red-500 mt-2">
            오류가 발생했어요. 다시 시도해 주세요.
          </p>
        )}
      </div>
    </section>
  );
}
