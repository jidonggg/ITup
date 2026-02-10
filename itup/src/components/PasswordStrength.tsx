"use client";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: "약함", color: "bg-red-500" };
  if (score <= 4) return { level: 2, label: "보통", color: "bg-yellow-500" };
  return { level: 3, label: "강함", color: "bg-green-500" };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { level, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= level ? color : "bg-card-border"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${level === 1 ? "text-red-500" : level === 2 ? "text-yellow-500" : "text-green-500"}`}>
        비밀번호 강도: {label}
      </p>
    </div>
  );
}
