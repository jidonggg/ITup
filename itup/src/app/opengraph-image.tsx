import { ImageResponse } from "next/og";
import { getDisplayDomain } from "@/lib/site-config";

export const runtime = "edge";

export const alt = "커피챗 - 게임 업계 멘토링 플랫폼";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FAF7F5 0%, #F0E8E0 50%, #FAF7F5 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 장식 원 */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(160,113,79,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* 커피 아이콘 */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #A0714F, #D4A574)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 8h1a4 4 0 110 8h-1" />
            <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
            <path d="M6 2v3M10 2v3M14 2v3" />
          </svg>
        </div>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#1A1209",
            letterSpacing: "-0.02em",
            display: "flex",
            marginBottom: 8,
          }}
        >
          커피챗
        </div>

        {/* 서브 타이틀 */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            background: "linear-gradient(90deg, #A0714F, #D4A574)",
            backgroundClip: "text",
            color: "transparent",
            display: "flex",
            marginBottom: 32,
          }}
        >
          게임 업계 멘토링 플랫폼
        </div>

        {/* 설명 */}
        <div
          style={{
            fontSize: 22,
            color: "#8C7E72",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          현직 게임 개발자와 1:1 멘토링으로 커리어 성장
        </div>

        {/* 하단 키워드 태그 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["넥슨", "넷마블", "크래프톤", "현직자 멘토"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                border: "1px solid rgba(160,113,79,0.3)",
                color: "#A0714F",
                fontSize: 18,
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* 하단 URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            color: "#8C7E72",
            fontSize: 16,
            display: "flex",
          }}
        >
          {getDisplayDomain()}
        </div>
      </div>
    ),
    { ...size }
  );
}
