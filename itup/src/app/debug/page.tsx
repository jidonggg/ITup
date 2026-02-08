"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // 쿠키 목록
    const cookies = document.cookie.split(";").map((c) => c.trim()).filter(Boolean);

    // localStorage keys
    const lsKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) lsKeys.push(key);
    }

    // sessionStorage keys
    const ssKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) ssKeys.push(key);
    }

    setInfo({
      cookies,
      cookieCount: cookies.length,
      localStorageKeys: lsKeys,
      sessionStorageKeys: ssKeys,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleClearAll = () => {
    // 모든 쿠키 삭제
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name) {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;`;
      }
    });
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 14 }}>
      <h1>Auth Debug</h1>
      <button onClick={handleClearAll} style={{ padding: "8px 16px", marginBottom: 16, background: "red", color: "white", border: "none", cursor: "pointer" }}>
        모든 쿠키/스토리지 삭제 후 새로고침
      </button>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  );
}
