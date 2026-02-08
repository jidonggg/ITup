"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0a", color: "#ededed" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", maxWidth: "400px", padding: "0 16px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
              문제가 발생했어요
            </h1>
            <p style={{ color: "#888", marginBottom: "24px" }}>
              예상치 못한 오류가 발생했어요. 다시 시도해주세요.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "12px 24px",
                background: "#a0714f",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
