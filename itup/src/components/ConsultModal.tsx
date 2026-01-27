"use client";

import { useState, useEffect } from "react";
import { useModalClose, useBodyScrollLock, formatPhoneNumber } from "@/hooks/useModal";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  email: "",
  interest: "",
  message: "",
};

export default function ConsultModal({ isOpen, onClose, mentorId }: ConsultModalProps) {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && user) {
      setFormData((prev) => ({
        ...prev,
        name: profile?.name || prev.name,
        email: user.email || prev.email,
        phone: profile?.phone || prev.phone,
      }));
    }
  }, [isOpen, user, profile]);

  const interests = [
    { value: "programming", label: "프로그래밍" },
    { value: "planning", label: "기획" },
    { value: "art", label: "아트" },
    { value: "qa", label: "QA" },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "연락처를 입력해주세요";
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "올바른 전화번호 형식이 아닙니다";
    }

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveToLocalStorage = () => {
    const consultations = JSON.parse(localStorage.getItem("consultations") || "[]");
    const newConsultation = {
      ...formData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    consultations.push(newConsultation);
    localStorage.setItem("consultations", JSON.stringify(consultations));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      saveToLocalStorage();
      setIsLoading(false);
      setIsSubmitted(true);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase.from("consultations").insert({
        mentor_id: mentorId || null,
        user_name: formData.name,
        user_phone: formData.phone,
        user_email: formData.email,
        interest: formData.interest || null,
        message: formData.message || null,
      });

      if (error) {
        console.error("Error saving consultation:", error);
        saveToLocalStorage();
      }

      setIsLoading(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error saving consultation:", error);
      saveToLocalStorage();
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitted(false);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === "phone" ? formatPhoneNumber(value) : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(139,92,246,0.4)] animate-[modalIn_0.3s_ease-out]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          {isSubmitted ? (
            /* 성공 화면 */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">신청이 완료되었습니다!</h3>
              <p className="text-muted mb-6">
                빠른 시일 내에 연락드리겠습니다.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
              >
                확인
              </button>
            </div>
          ) : (
            /* 폼 화면 */
            <>
              <h2 className="text-2xl font-bold mb-2">무료 상담 신청</h2>
              <p className="text-muted text-sm mb-6">
                아래 정보를 입력하시면 멘토가 직접 연락드립니다.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="홍길동"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.name ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* 연락처 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.phone ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.email ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* 관심 분야 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">관심 분야</label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="">선택해주세요</option>
                    {interests.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 문의 내용 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">문의 내용</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="궁금한 점이나 상담받고 싶은 내용을 적어주세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      처리 중...
                    </span>
                  ) : (
                    "상담 신청하기"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
