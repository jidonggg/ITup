"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mentor, Consultation } from "@/lib/supabase/types";

type ConsultationStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusLabels: Record<ConsultationStatus, string> = {
  pending: "대기중",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
};

const statusColors: Record<ConsultationStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  confirmed: "bg-blue-500/20 text-blue-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const interestLabels: Record<string, string> = {
  programming: "프로그래밍",
  planning: "기획",
  art: "아트",
  qa: "QA",
};

export default function MentorDashboardPage() {
  const { user, isInitialized } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ConsultationStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchMentorData();
  }, [isInitialized, user]);

  const fetchMentorData = async () => {
    if (!isSupabaseConfigured()) {
      setError("데이터베이스 연결이 필요합니다.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      // 현재 사용자가 멘토인지 확인
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (mentorError || !mentorData) {
        setError("멘토 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setMentor(mentorData);

      // 해당 멘토의 상담 신청 목록 조회
      const { data: consultData, error: consultError } = await supabase
        .from("consultations")
        .select("*")
        .eq("mentor_id", mentorData.id)
        .order("created_at", { ascending: false });

      if (consultError) {
        console.error("Error fetching consultations:", consultError);
      } else {
        setConsultations(consultData || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsultationStatus = async (consultationId: string, newStatus: ConsultationStatus) => {
    if (!isSupabaseConfigured()) return;

    setUpdatingId(consultationId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("consultations")
        .update({ status: newStatus })
        .eq("id", consultationId);

      if (error) {
        console.error("Error updating status:", error);
        alert("상태 변경에 실패했습니다.");
        return;
      }

      // 로컬 상태 업데이트
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === consultationId ? { ...c, status: newStatus } : c
        )
      );

      // 상담 확정 시 이메일 알림 발송
      if (newStatus === "confirmed") {
        fetch("/api/email/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "consultation_confirmed",
            data: { consultationId },
          }),
        }).catch(console.error);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("오류가 발생했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredConsultations = selectedStatus === "all"
    ? consultations
    : consultations.filter((c) => c.status === selectedStatus);

  const stats = {
    total: consultations.length,
    pending: consultations.filter((c) => c.status === "pending").length,
    confirmed: consultations.filter((c) => c.status === "confirmed").length,
    completed: consultations.filter((c) => c.status === "completed").length,
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="text-muted mb-6">멘토 대시보드는 로그인 후 이용 가능합니다.</p>
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-full font-medium"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">멘토 전용 페이지</h1>
          <p className="text-muted mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/mentor/register"
              className="px-6 py-3 bg-primary text-white rounded-full font-medium"
            >
              멘토 등록하기
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-card-border text-foreground rounded-full font-medium"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-sm">☕</span>
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium">멘토 대시보드</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{mentor?.name} 멘토</span>
            <Link href="/mentor/edit" className="text-sm text-accent hover:underline">
              프로필 수정
            </Link>
            <Link href="/" className="text-sm text-primary hover:underline">
              사이트로 이동
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">안녕하세요, {mentor?.name}님!</h1>
          <p className="text-muted">받은 상담 신청을 확인하고 관리하세요.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">전체 신청</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">대기중</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">확정</p>
            <p className="text-3xl font-bold text-blue-500">{stats.confirmed}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">완료</p>
            <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
          </div>
        </div>

        {/* Mentor Info */}
        {mentor && !mentor.is_approved && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-500 text-sm">
              멘토 승인 대기 중입니다. 승인 후 멘토 목록에 노출됩니다.
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-card-border">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                selectedStatus === status
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {status === "all" ? "전체" : statusLabels[status]}
              {status !== "all" && (
                <span className="ml-1 text-xs">
                  ({consultations.filter((c) => c.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Consultations List */}
        {filteredConsultations.length === 0 ? (
          <div className="text-center py-16 bg-card-bg border border-card-border rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {selectedStatus === "all" ? "받은 상담 신청이 없습니다" : `${statusLabels[selectedStatus as ConsultationStatus]} 상태의 신청이 없습니다`}
            </h3>
            <p className="text-muted">새로운 상담 신청이 오면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                onUpdateStatus={updateConsultationStatus}
                isUpdating={updatingId === consultation.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface ConsultationCardProps {
  consultation: Consultation;
  onUpdateStatus: (id: string, status: ConsultationStatus) => void;
  isUpdating: boolean;
}

function ConsultationCard({ consultation, onUpdateStatus, isUpdating }: ConsultationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getNextActions = (status: ConsultationStatus): { label: string; status: ConsultationStatus; color: string }[] => {
    switch (status) {
      case "pending":
        return [
          { label: "확정하기", status: "confirmed", color: "bg-blue-500 hover:bg-blue-600" },
          { label: "취소", status: "cancelled", color: "bg-red-500/20 text-red-500 hover:bg-red-500/30" },
        ];
      case "confirmed":
        return [
          { label: "완료 처리", status: "completed", color: "bg-green-500 hover:bg-green-600" },
          { label: "취소", status: "cancelled", color: "bg-red-500/20 text-red-500 hover:bg-red-500/30" },
        ];
      default:
        return [];
    }
  };

  const actions = getNextActions(consultation.status);

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{consultation.user_name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[consultation.status]}`}>
                {statusLabels[consultation.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <span>{consultation.user_email}</span>
              {consultation.interest && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                  {interestLabels[consultation.interest] || consultation.interest}
                </span>
              )}
              <span>{new Date(consultation.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-muted transition-transform ${showDetails ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {showDetails && (
        <div className="px-6 pb-6 border-t border-card-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted mb-1">연락처</p>
              <p className="font-medium">{consultation.user_phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">이메일</p>
              <p className="font-medium">{consultation.user_email}</p>
            </div>
          </div>

          {consultation.message && (
            <div className="mb-4">
              <p className="text-xs text-muted mb-1">문의 내용</p>
              <p className="p-3 bg-secondary rounded-lg text-sm">{consultation.message}</p>
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action) => (
                <button
                  key={action.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(consultation.id, action.status);
                  }}
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    action.color.includes("text-") ? action.color : `${action.color} text-white`
                  }`}
                >
                  {isUpdating ? "처리중..." : action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
