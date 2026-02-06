"use client";

import type { Settlement, SettlementStatus } from "@/lib/supabase/types";

const statusLabels: Record<SettlementStatus, string> = {
  pending: "대기중",
  processing: "처리중",
  completed: "완료",
  failed: "실패",
};

const statusColors: Record<SettlementStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  processing: "bg-blue-500/20 text-blue-500",
  completed: "bg-green-500/20 text-green-500",
  failed: "bg-red-500/20 text-red-500",
};

interface SettlementHistoryTableProps {
  settlements: Settlement[];
}

export default function SettlementHistoryTable({ settlements }: SettlementHistoryTableProps) {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-12 bg-card-bg border border-card-border rounded-xl">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
          <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-muted text-sm">정산 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">정산 기간</th>
            <th className="px-4 py-3 text-right text-sm font-medium">총 매출</th>
            <th className="px-4 py-3 text-right text-sm font-medium">수수료</th>
            <th className="px-4 py-3 text-right text-sm font-medium">정산액</th>
            <th className="px-4 py-3 text-center text-sm font-medium">수수료율</th>
            <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
            <th className="px-4 py-3 text-left text-sm font-medium">정산일</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((settlement) => (
            <tr key={settlement.id} className="border-t border-card-border">
              <td className="px-4 py-3 text-sm">
                <p className="font-medium">
                  {settlement.period_start
                    ? new Date(settlement.period_start).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
                <p className="text-xs text-muted">
                  ~ {settlement.period_end
                    ? new Date(settlement.period_end).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium">
                {settlement.total_amount.toLocaleString("ko-KR")}원
              </td>
              <td className="px-4 py-3 text-sm text-right text-muted">
                -{settlement.platform_fee.toLocaleString("ko-KR")}원
              </td>
              <td className="px-4 py-3 text-sm text-right font-bold text-primary">
                {settlement.settlement_amount.toLocaleString("ko-KR")}원
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-xs text-muted">
                  {(settlement.commission_rate * 100).toFixed(0)}%
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[settlement.status]}`}>
                  {statusLabels[settlement.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted">
                {settlement.settled_at
                  ? new Date(settlement.settled_at).toLocaleDateString("ko-KR")
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
