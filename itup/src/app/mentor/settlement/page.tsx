"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Mentor, Settlement, MentorBankAccount } from "@/lib/supabase/types";
import { COMMISSION_TIERS } from "@/lib/constants";
import { getCommissionRate, formatKRW } from "@/lib/settlement/calculate";
import { LogoIcon } from "@/components/icons";
import SettlementHistoryTable from "@/components/settlement/SettlementHistoryTable";
import BankAccountForm from "@/components/settlement/BankAccountForm";

export default function SettlementPage() {
  const { user, isInitialized } = useAuth();
  const { showToast } = useToast();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [bankAccount, setBankAccount] = useState<MentorBankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Summary stats
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [completedAmount, setCompletedAmount] = useState(0);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!isSupabaseConfigured()) {
        setError("데이터베이스 연결이 필요해요.");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        // Fetch mentor
        const { data: mentorData, error: mentorError } = await supabase
          .from("mentors")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (mentorError || !mentorData) {
          setError("멘토 정보를 찾을 수 없어요.");
          setIsLoading(false);
          return;
        }

        setMentor(mentorData);

        // Fetch settlements
        const { data: settlementData } = await supabase
          .from("settlements")
          .select("*")
          .eq("mentor_id", mentorData.id)
          .order("created_at", { ascending: false });

        if (settlementData) {
          setSettlements(settlementData);

          const completed = settlementData
            .filter(s => s.status === "completed")
            .reduce((sum, s) => sum + s.settlement_amount, 0);
          const pending = settlementData
            .filter(s => s.status === "pending" || s.status === "processing")
            .reduce((sum, s) => sum + s.settlement_amount, 0);
          const total = settlementData
            .reduce((sum, s) => sum + s.total_amount, 0);

          setCompletedAmount(completed);
          setPendingAmount(pending);
          setTotalEarnings(total);
        }

        // Fetch bank account
        const { data: bankData } = await supabase
          .from("mentor_bank_accounts")
          .select("*")
          .eq("mentor_id", mentorData.id)
          .eq("is_default", true)
          .single();

        if (bankData) {
          setBankAccount(bankData);
        }
      } catch {
        setError("데이터를 불러오는 중 오류가 발생했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isInitialized, user]);

  const handleSaveBankAccount = async (data: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  }) => {
    if (!mentor || !isSupabaseConfigured()) return;

    setIsSavingAccount(true);
    const supabase = createClient();

    try {
      if (bankAccount) {
        // Update existing
        const { error } = await supabase
          .from("mentor_bank_accounts")
          .update({
            bank_name: data.bank_name,
            account_number: data.account_number,
            account_holder: data.account_holder,
          })
          .eq("id", bankAccount.id);

        if (error) {
          showToast("계좌 수정에 실패했어요.", "error");
          return;
        }

        setBankAccount({ ...bankAccount, ...data });
        showToast("계좌 정보가 수정되었어요.", "success");
      } else {
        // Create new
        const { data: newAccount, error } = await supabase
          .from("mentor_bank_accounts")
          .insert({
            mentor_id: mentor.id,
            bank_name: data.bank_name,
            account_number: data.account_number,
            account_holder: data.account_holder,
            is_default: true,
          })
          .select()
          .single();

        if (error) {
          showToast("계좌 등록에 실패했어요.", "error");
          return;
        }

        setBankAccount(newAccount);
        showToast("계좌가 등록되었어요.", "success");
      }
    } catch {
      showToast("오류가 발생했어요.", "error");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleDeleteBankAccount = async () => {
    if (!bankAccount || !isSupabaseConfigured()) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("mentor_bank_accounts")
        .delete()
        .eq("id", bankAccount.id);

      if (error) {
        showToast("계좌 삭제에 실패했어요.", "error");
        return;
      }

      setBankAccount(null);
      showToast("계좌가 삭제되었어요.", "success");
    } catch {
      showToast("오류가 발생했어요.", "error");
    }
  };

  const { rate, label: tierLabel } = getCommissionRate(completedAmount);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted mb-6">정산 페이지는 로그인 후 이용할 수 있어요.</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-full font-medium">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">멘토 전용 페이지</h1>
          <p className="text-muted mb-6">{error}</p>
          <Link href="/" className="px-6 py-3 bg-primary text-white rounded-full font-medium">
            홈으로 이동
          </Link>
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
                <LogoIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <Link href="/mentor/dashboard" className="text-muted hover:text-foreground transition-colors text-sm">
              대시보드
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium">정산</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{mentor?.name} 멘토</span>
            <Link href="/mentor/dashboard" className="text-sm text-primary hover:underline">
              대시보드
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">정산 관리</h1>
        <p className="text-muted mb-8">정산 내역을 확인하고 입금 계좌를 관리하세요.</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">총 매출</p>
            <p className="text-2xl font-bold text-foreground">{formatKRW(totalEarnings)}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">정산 완료</p>
            <p className="text-2xl font-bold text-green-500">{formatKRW(completedAmount)}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">정산 대기</p>
            <p className="text-2xl font-bold text-yellow-500">{formatKRW(pendingAmount)}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">현재 수수료율</p>
            <p className="text-2xl font-bold text-primary">{(rate * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted mt-1">{tierLabel}</p>
          </div>
        </div>

        {/* Commission Tiers Info */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">수수료 단계</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COMMISSION_TIERS.map((tier, i) => (
              <div
                key={i}
                className={`rounded-lg p-4 text-center border ${
                  rate === tier.rate
                    ? "border-primary bg-primary/10"
                    : "border-card-border bg-secondary/30"
                }`}
              >
                <p className="text-xs text-muted mb-1">{tier.label}</p>
                <p className="text-xl font-bold">{(tier.rate * 100).toFixed(0)}%</p>
                <p className="text-xs text-muted mt-1">
                  {tier.max === Infinity
                    ? `${(tier.min / 10000).toLocaleString()}만원+`
                    : `${(tier.min / 10000).toLocaleString()}~${(tier.max / 10000).toLocaleString()}만원`}
                </p>
                {rate === tier.rate && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                    현재 등급
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settlement History */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">정산 내역</h2>
            <SettlementHistoryTable settlements={settlements} />
          </div>

          {/* Bank Account Management */}
          <div>
            <h2 className="text-lg font-bold mb-4">입금 계좌</h2>
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              {bankAccount && (
                <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted mb-1">현재 등록 계좌</p>
                  <p className="font-semibold">{bankAccount.bank_name}</p>
                  <p className="text-sm text-muted">
                    {bankAccount.account_number.replace(/(\d{4})/g, "$1-").replace(/-$/, "")}
                  </p>
                  <p className="text-sm text-muted">{bankAccount.account_holder}</p>
                </div>
              )}

              <BankAccountForm
                existingAccount={bankAccount}
                onSave={handleSaveBankAccount}
                onDelete={bankAccount ? handleDeleteBankAccount : undefined}
                isSaving={isSavingAccount}
              />
            </div>

            {/* Settlement Info */}
            <div className="mt-6 bg-card-bg border border-card-border rounded-xl p-6">
              <h3 className="font-semibold mb-3">정산 안내</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>
                  완료된 세션은 분쟁 기간(7일) 후 정산 대상에 포함됩니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>
                  매주 월요일에 정산이 진행되며, 3영업일 이내 입금됩니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>
                  최소 정산 금액은 10,000원입니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>
                  누적 정산액이 늘어나면 수수료율이 낮아집니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
