"use client";

import { useState } from "react";
import { COMMISSION_TIERS } from "@/lib/constants";

function getCommissionRate(completedSessions: number): { rate: number; label: string } {
  for (const tier of COMMISSION_TIERS) {
    if (completedSessions >= tier.min && completedSessions < tier.max) {
      return { rate: tier.rate, label: tier.label };
    }
  }
  return { rate: COMMISSION_TIERS[0].rate, label: COMMISSION_TIERS[0].label };
}

export default function EarningsCalculator() {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5);
  const [avgPrice, setAvgPrice] = useState(40000);

  const monthlyGross = sessionsPerWeek * avgPrice * 4;
  const annualGross = monthlyGross * 12;
  const monthlySessions = sessionsPerWeek * 4;
  const annualSessions = monthlySessions * 12;
  const { rate, label } = getCommissionRate(annualSessions);
  const monthlyNet = Math.round(monthlyGross * (1 - rate));
  const annualNet = Math.round(annualGross * (1 - rate));

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-8">
      <h3 className="text-2xl font-bold mb-6 text-center">수익 계산기</h3>
      <p className="text-muted text-center mb-8">
        멘토링 활동으로 예상 수입을 확인해 보세요
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-6">
          {/* Sessions per week */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">주당 세션 수</span>
              <span className="text-lg font-bold text-primary">{sessionsPerWeek}회</span>
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={sessionsPerWeek}
              onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>1회</span>
              <span>20회</span>
            </div>
          </div>

          {/* Average price */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">평균 세션 가격</span>
              <span className="text-lg font-bold text-primary">
                {avgPrice.toLocaleString("ko-KR")}원
              </span>
            </label>
            <input
              type="range"
              min={10000}
              max={300000}
              step={5000}
              value={avgPrice}
              onChange={(e) => setAvgPrice(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>1만원</span>
              <span>30만원</span>
            </div>
          </div>

          {/* Commission tier info */}
          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-xs text-muted mb-1">적용 수수료율</p>
            <p className="text-sm font-semibold text-accent">{label}</p>
            <p className="text-xs text-muted mt-2">
              완료 건수가 많아질수록 수수료율이 낮아져요
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6">
            <p className="text-sm text-muted mb-1">예상 월 수입</p>
            <p className="text-4xl font-bold text-primary">
              {monthlyNet.toLocaleString("ko-KR")}
              <span className="text-lg text-muted ml-1">원</span>
            </p>
            <p className="text-xs text-muted mt-2">
              총 매출 {monthlyGross.toLocaleString("ko-KR")}원 - 수수료 {(rate * 100).toFixed(0)}%
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-6">
            <p className="text-sm text-muted mb-1">예상 연 수입</p>
            <p className="text-3xl font-bold text-foreground">
              {annualNet.toLocaleString("ko-KR")}
              <span className="text-lg text-muted ml-1">원</span>
            </p>
            <p className="text-xs text-muted mt-2">
              총 매출 {annualGross.toLocaleString("ko-KR")}원
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted">월 세션 수</p>
                <p className="text-lg font-bold">{sessionsPerWeek * 4}회</p>
              </div>
              <div>
                <p className="text-xs text-muted">월 총 매출</p>
                <p className="text-lg font-bold">{monthlyGross.toLocaleString("ko-KR")}원</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission tiers */}
      <div className="mt-8 border-t border-card-border pt-6">
        <h4 className="text-sm font-semibold mb-3">수수료 단계</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COMMISSION_TIERS.map((tier, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-center border ${
                rate === tier.rate
                  ? "border-primary bg-primary/10"
                  : "border-card-border bg-secondary/30"
              }`}
            >
              <p className="text-xs text-muted mb-1">{tier.label}</p>
              <p className="text-lg font-bold">
                {(tier.rate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted">
                {tier.max === Infinity
                  ? `${tier.min}건+`
                  : `${tier.min}~${tier.max}건`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
