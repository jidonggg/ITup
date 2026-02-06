"use client";

import { useState, useEffect } from "react";
import { KOREAN_BANKS } from "@/lib/constants";
import type { MentorBankAccount } from "@/lib/supabase/types";

interface BankAccountFormProps {
  existingAccount?: MentorBankAccount | null;
  onSave: (data: { bank_name: string; account_number: string; account_holder: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSaving: boolean;
}

export default function BankAccountForm({ existingAccount, onSave, onDelete, isSaving }: BankAccountFormProps) {
  const [bankName, setBankName] = useState(existingAccount?.bank_name || "");
  const [accountNumber, setAccountNumber] = useState(existingAccount?.account_number || "");
  const [accountHolder, setAccountHolder] = useState(existingAccount?.account_holder || "");
  const [isDeleting, setIsDeleting] = useState(false);

  // existingAccount prop 변경 시 폼 값 동기화
  useEffect(() => {
    setBankName(existingAccount?.bank_name || "");
    setAccountNumber(existingAccount?.account_number || "");
    setAccountHolder(existingAccount?.account_holder || "");
  }, [existingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName || !accountNumber || !accountHolder) return;

    await onSave({
      bank_name: bankName,
      account_number: accountNumber.replace(/\s/g, ""),
      account_holder: accountHolder,
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("계좌 정보를 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">은행</label>
        <select
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">은행을 선택하세요</option>
          {KOREAN_BANKS.map((bank) => (
            <option key={bank.code} value={bank.name}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">계좌번호</label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="'-' 없이 계좌번호를 입력하세요"
          required
          className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">예금주</label>
        <input
          type="text"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          placeholder="예금주명을 입력하세요"
          required
          className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving || !bankName || !accountNumber || !accountHolder}
          className="flex-1 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "저장 중..." : existingAccount ? "수정" : "등록"}
        </button>

        {existingAccount && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-2.5 bg-red-500/20 text-red-500 rounded-xl font-medium hover:bg-red-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? "삭제중..." : "삭제"}
          </button>
        )}
      </div>
    </form>
  );
}
