"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Consultation, Mentor } from "@/lib/supabase/types";

interface ConsultationWithMentor extends Consultation {
  mentor?: Mentor | null;
}

export default function MyPage() {
  const router = useRouter();
  const { user, profile, isLoading, isInitialized, signOut, refreshProfile } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationWithMentor[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    // 초기화 완료 후 user가 없으면 홈으로 이동
    if (isInitialized && !user) {
      router.push("/");
    }
  }, [isInitialized, user, router]);

  // Fetch consultations
  useEffect(() => {
    const fetchConsultations = async () => {
      if (!user || !isSupabaseConfigured()) {
        setIsLoadingConsultations(false);
        return;
      }

      try {
        const supabase = createClient();

        // Fetch consultations by user email
        const { data: consultData, error } = await supabase
          .from("consultations")
          .select("*")
          .eq("user_email", user.email)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching consultations:", error);
          return;
        }

        if (consultData && consultData.length > 0) {
          // Fetch mentor info for each consultation
          const mentorIds = [...new Set(consultData.map(c => c.mentor_id).filter(Boolean))];

          let mentorsMap: Record<string, Mentor> = {};
          if (mentorIds.length > 0) {
            const { data: mentorData } = await supabase
              .from("mentors")
              .select("*")
              .in("id", mentorIds);

            if (mentorData) {
              mentorsMap = Object.fromEntries(mentorData.map(m => [m.id, m]));
            }
          }

          const consultationsWithMentor = consultData.map(c => ({
            ...c,
            mentor: c.mentor_id ? mentorsMap[c.mentor_id] : null,
          }));

          setConsultations(consultationsWithMentor);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoadingConsultations(false);
      }
    };

    if (user) {
      fetchConsultations();
    }
  }, [user]);

  // Initialize edit form
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user || !isSupabaseConfigured()) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editName,
          phone: editPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        alert("프로필 수정에 실패했습니다.");
      } else {
        await refreshProfile();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-600",
      confirmed: "bg-blue-500/20 text-blue-600",
      completed: "bg-green-500/20 text-green-600",
      cancelled: "bg-red-500/20 text-red-600",
    };
    const labels = {
      pending: "대기중",
      confirmed: "확정",
      completed: "완료",
      cancelled: "취소",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-sm">☕</span>
            </div>
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
              커피챗
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">마이페이지</h1>

        {/* Profile Section */}
        <section className="bg-card-bg border border-card-border rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">프로필 정보</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                수정
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">이름</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-card-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">이메일</label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full px-4 py-3 bg-secondary border border-card-border rounded-lg text-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">연락처</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 bg-background border border-card-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(profile?.name || "");
                    setEditPhone(profile?.phone || "");
                  }}
                  className="px-6 py-2 border border-card-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                  {(profile?.name || user.email)?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-semibold text-lg">{profile?.name || "이름 미설정"}</p>
                  <p className="text-muted text-sm">{user.email}</p>
                </div>
              </div>
              {profile?.phone && (
                <div className="pt-4 border-t border-card-border">
                  <p className="text-sm text-muted">연락처</p>
                  <p>{profile.phone}</p>
                </div>
              )}
              <div className="pt-4 border-t border-card-border">
                <p className="text-sm text-muted">가입일</p>
                <p>{new Date(profile?.created_at || user.created_at).toLocaleDateString("ko-KR")}</p>
              </div>
            </div>
          )}
        </section>

        {/* Consultations Section */}
        <section className="bg-card-bg border border-card-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">상담 신청 내역</h2>

          {isLoadingConsultations ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">☕</div>
              <p className="text-muted mb-4">아직 신청한 상담이 없습니다.</p>
              <Link
                href="/mentors"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                멘토 둘러보기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-4 bg-background border border-card-border rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">
                        {consultation.mentor?.name || "멘토"} 멘토님과의 상담
                      </p>
                      <p className="text-sm text-muted">
                        {consultation.mentor?.company} · {consultation.mentor?.role}
                      </p>
                    </div>
                    {getStatusBadge(consultation.status)}
                  </div>
                  {consultation.interest && (
                    <p className="text-sm text-muted mb-2">
                      관심 분야: {consultation.interest}
                    </p>
                  )}
                  {consultation.message && (
                    <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
                      {consultation.message}
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    신청일: {new Date(consultation.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
