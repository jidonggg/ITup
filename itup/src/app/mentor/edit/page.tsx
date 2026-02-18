"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { skillCategories } from "@/data/mentors";
import { VALIDATION, PRICE_LIMITS, RECOMMENDED_PRICES, PRODUCT_INFO, MENTORING_STYLES, MAX_MENTORING_STYLES } from "@/lib/constants";
import { ProductIcon } from "@/components/icons";
import { getMentorTier, isProductAvailableForTier } from "@/lib/pricing/tiers";
import type { ConsultType, InsertableProductType, Product } from "@/lib/supabase/types";

const consultTypeOptions: { value: ConsultType; label: string }[] = [
  { value: "coffee", label: "1:1 상담" },
  { value: "resume", label: "이력서/포트폴리오" },
  { value: "interview", label: "모의면접" },
];

const experienceOptions = [
  "3-5년",
  "5-7년",
  "7-10년",
  "10년 이상",
];

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 9; // 09:00 ~ 22:00
  return `${hour.toString().padStart(2, "0")}:00`;
});

type MentorProductType = InsertableProductType;

interface ProductSetting {
  enabled: boolean;
  price: number | "";
  existingId?: string; // existing product ID from DB
}

interface FormData {
  name: string;
  company: string;
  role: string;
  previousCompanies: string;
  experience: string;
  skills: string[];
  consultTypes: ConsultType[];
  availableTimes: Record<DayKey, string[]>;
  bio: string;
  mentoringStyles: string[];
  products: Record<MentorProductType, ProductSetting>;
}

const initialFormData: FormData = {
  name: "",
  company: "",
  role: "",
  previousCompanies: "",
  experience: "",
  skills: [],
  consultTypes: [],
  availableTimes: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  bio: "",
  mentoringStyles: [],
  products: {
    coffee_chat: { enabled: false, price: "" },
    mock_interview: { enabled: false, price: "" },
  },
};

const PRODUCT_TYPES: MentorProductType[] = ["coffee_chat", "mock_interview"];

const formatPrice = (value: number): string => value.toLocaleString("ko-KR");

export default function MentorEditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 기존 멘토 정보 불러오기
  useEffect(() => {
    const fetchMentorData = async () => {
      if (!user || !isSupabaseConfigured()) {
        setIsLoadingData(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setNotFound(true);
        setIsLoadingData(false);
        return;
      }

      setMentorId(data.id);
      setIsApproved(data.is_approved || false);
      // available_times: parse from flat string array ["mon 09:00", "tue 14:00"]
      // or from Record<DayKey, string[]> format
      const labelToKey: Record<string, DayKey> = {
        mon: "mon", tue: "tue", wed: "wed", thu: "thu",
        fri: "fri", sat: "sat", sun: "sun",
        "월": "mon", "화": "tue", "수": "wed", "목": "thu",
        "금": "fri", "토": "sat", "일": "sun",
      };
      const parsedTimes: Record<DayKey, string[]> = {
        mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
      };
      const rawTimes = data.available_times;
      if (rawTimes) {
        if (Array.isArray(rawTimes)) {
          for (const entry of rawTimes as string[]) {
            const parts = entry.split(" ");
            if (parts.length >= 2) {
              const dayKey = labelToKey[parts[0]];
              if (dayKey) {
                parsedTimes[dayKey].push(parts[1]);
              }
            }
          }
        } else if (typeof rawTimes === "object") {
          for (const [day, slots] of Object.entries(rawTimes as Record<string, string[]>)) {
            const dayKey = labelToKey[day];
            if (dayKey && Array.isArray(slots)) {
              parsedTimes[dayKey] = [...slots];
            }
          }
        }
      }

      // Fetch products for this mentor
      const productSettings: Record<MentorProductType, ProductSetting> = {
        coffee_chat: { enabled: false, price: "" },
        mock_interview: { enabled: false, price: "" },
      };

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("mentor_id", data.id);

      if (productsData) {
        for (const p of productsData as Product[]) {
          const pType = p.type as MentorProductType;
          if (pType === "coffee_chat" || pType === "mock_interview") {
            productSettings[pType] = {
              enabled: p.is_active,
              price: p.price,
              existingId: p.id,
            };
          }
        }
      }

      setFormData({
        name: data.name || "",
        company: data.company || "",
        role: data.role || "",
        previousCompanies: (data.previous_companies || []).join(", "),
        experience: data.experience || "",
        skills: data.skills || [],
        consultTypes: (data.consult_types || []) as ConsultType[],
        availableTimes: parsedTimes,
        bio: data.bio || "",
        mentoringStyles: data.mentoring_styles || [],
        products: productSettings,
      });
      setIsLoadingData(false);
    };

    if (!authLoading && user) {
      fetchMentorData();
    } else if (!authLoading && !user) {
      setIsLoadingData(false);
    }
  }, [authLoading, user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "닉네임을 입력해주세요";
    }
    if (!formData.company.trim()) {
      newErrors.company = "현재 직장을 입력해주세요";
    }
    if (!formData.role.trim()) {
      newErrors.role = "직책/역할을 입력해주세요";
    }
    if (!formData.experience) {
      newErrors.experience = "경력을 선택해주세요";
    }
    if (formData.skills.length === 0) {
      newErrors.skills = "최소 1개 이상의 기술을 선택해주세요";
    }
    if (formData.consultTypes.length === 0) {
      newErrors.consultTypes = "최소 1개 이상의 상담 유형을 선택해주세요";
    }

    // 활성화된 상품의 가격 범위 검증
    for (const type of PRODUCT_TYPES) {
      const setting = formData.products[type];
      if (setting.enabled) {
        const limits = PRICE_LIMITS[type];
        const price = setting.price;
        if (price === "" || (typeof price === "number" && (price < limits.min || price > limits.max))) {
          newErrors.products = `가격은 ${limits.min.toLocaleString()}원 ~ ${limits.max.toLocaleString()}원 범위여야 합니다`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !mentorId) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const previousCompaniesArray = formData.previousCompanies
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // available_times: convert Record<DayKey, string[]> to flat string array
      const availableTimesData: string[] = [];
      for (const [day, slots] of Object.entries(formData.availableTimes)) {
        for (const slot of slots) {
          availableTimesData.push(`${day} ${slot}`);
        }
      }

      const { error } = await supabase
        .from("mentors")
        .update({
          name: formData.name,
          role: formData.role,
          company: formData.company,
          previous_companies: previousCompaniesArray,
          experience: formData.experience,
          skills: formData.skills,
          bio: formData.bio || null,
          available_times: availableTimesData as string[],
          consult_types: formData.consultTypes,
          mentoring_styles: formData.mentoringStyles,
        })
        .eq("id", mentorId);

      if (error) {
        // mentoring_styles 컬럼이 아직 DB에 없을 수 있으므로 해당 필드 제외 후 재시도
        if (error.message?.includes("mentoring_styles")) {
          const { error: retryError } = await supabase
            .from("mentors")
            .update({
              name: formData.name,
              role: formData.role,
              company: formData.company,
              previous_companies: previousCompaniesArray,
              experience: formData.experience,
              skills: formData.skills,
              bio: formData.bio || null,
              available_times: availableTimesData as string[],
              consult_types: formData.consultTypes,
            })
            .eq("id", mentorId);

          if (retryError) {
            showToast("프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
            setIsSubmitting(false);
            return;
          }
        } else {
          showToast("프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
          setIsSubmitting(false);
          return;
        }
      }

      // Save products
      for (const type of PRODUCT_TYPES) {
        const setting = formData.products[type];
        if (setting.existingId) {
          // Update existing product
          await supabase
            .from("products")
            .update({
              price: setting.enabled ? (setting.price as number) : 0,
              is_active: setting.enabled,
            })
            .eq("id", setting.existingId);
        } else if (setting.enabled && setting.price !== "") {
          // Create new product
          await supabase
            .from("products")
            .insert({
              mentor_id: mentorId,
              type,
              title: PRODUCT_INFO[type].name,
              description: PRODUCT_INFO[type].description,
              duration_minutes: PRODUCT_INFO[type].duration,
              price: setting.price as number,
              is_active: true,
            });
        }
      }

      setIsSuccess(true);
    } catch (error) {
      showToast("프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProduct = (type: MentorProductType) => {
    setFormData((prev) => ({
      ...prev,
      products: {
        ...prev.products,
        [type]: {
          ...prev.products[type],
          enabled: !prev.products[type].enabled,
          price: !prev.products[type].enabled ? RECOMMENDED_PRICES[type] : prev.products[type].price,
        },
      },
    }));
  };

  const handlePriceChange = (type: MentorProductType, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    const num = numericValue === "" ? "" : parseInt(numericValue, 10);
    setFormData((prev) => ({
      ...prev,
      products: {
        ...prev.products,
        [type]: { ...prev.products[type], price: num },
      },
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // 경력 변경 시 티어 제한에 걸리는 상품 자동 비활성화
      if (name === "experience" && value) {
        const newTier = getMentorTier(value);
        for (const type of PRODUCT_TYPES) {
          if (!isProductAvailableForTier(type, newTier) && next.products[type].enabled) {
            next.products = {
              ...next.products,
              [type]: { ...next.products[type], enabled: false },
            };
          }
        }
      }
      return next;
    });
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: undefined }));
    }
  };

  const handleConsultTypeToggle = (type: ConsultType) => {
    setFormData((prev) => ({
      ...prev,
      consultTypes: prev.consultTypes.includes(type)
        ? prev.consultTypes.filter((t) => t !== type)
        : [...prev.consultTypes, type],
    }));
    if (errors.consultTypes) {
      setErrors((prev) => ({ ...prev, consultTypes: undefined }));
    }
  };

  const handleMentoringStyleToggle = (styleValue: string) => {
    setFormData((prev) => ({
      ...prev,
      mentoringStyles: prev.mentoringStyles.includes(styleValue)
        ? prev.mentoringStyles.filter((s) => s !== styleValue)
        : prev.mentoringStyles.length < MAX_MENTORING_STYLES
          ? [...prev.mentoringStyles, styleValue]
          : prev.mentoringStyles,
    }));
  };

  const toggleTimeSlot = (day: DayKey, time: string) => {
    setFormData((prev) => {
      const current = prev.availableTimes[day];
      const updated = current.includes(time)
        ? current.filter((t) => t !== time)
        : [...current, time].sort();
      return {
        ...prev,
        availableTimes: { ...prev.availableTimes, [day]: updated },
      };
    });
  };

  const toggleAllDay = (day: DayKey) => {
    setFormData((prev) => {
      const current = prev.availableTimes[day];
      const allSelected = current.length === TIME_SLOTS.length;
      return {
        ...prev,
        availableTimes: {
          ...prev.availableTimes,
          [day]: allSelected ? [] : [...TIME_SLOTS],
        },
      };
    });
  };

  const selectedCount = Object.values(formData.availableTimes).reduce(
    (sum, slots) => sum + slots.length, 0
  );

  if (authLoading || isLoadingData) {
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted mb-6">멘토 프로필을 수정하려면 먼저 로그인해주세요.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">멘토 등록이 필요합니다</h2>
          <p className="text-muted mb-6">아직 멘토로 등록되지 않았습니다. 먼저 멘토로 등록해주세요.</p>
          <Link
            href="/mentor/apply"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
          >
            멘토 등록하기
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">프로필 수정 완료!</h2>
          <p className="text-muted mb-6">멘토 프로필이 성공적으로 업데이트되었습니다.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mentor/dashboard"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              대시보드로 이동
            </Link>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-6 py-2.5 border border-card-border rounded-full font-medium cursor-pointer"
            >
              계속 수정
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/mentor/dashboard"
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드로
          </Link>
          <h1 className="text-3xl font-bold mb-2">멘토 프로필 수정</h1>
          <p className="text-muted">멘토 정보를 수정할 수 있습니다</p>

          {/* 승인 상태 */}
          <div className={`mt-4 px-4 py-2 rounded-lg inline-flex items-center gap-2 ${
            isApproved ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
          }`}>
            {isApproved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">승인됨 - 멘토 목록에 표시 중</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">승인 대기 중</span>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
              <div className="space-y-4">
                {/* 닉네임 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    닉네임 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="멘토로 표시될 닉네임"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.name ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* 현재 직장 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    현재 직장 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="예: 넥슨, 넷마블, 크래프톤"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.company ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
                </div>

                {/* 직책/역할 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    직책/역할 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="예: 시니어 게임 프로그래머"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.role ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                </div>

                {/* 이전 직장 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    이전 직장 <span className="text-muted">(선택)</span>
                  </label>
                  <input
                    type="text"
                    name="previousCompanies"
                    value={formData.previousCompanies}
                    onChange={handleChange}
                    placeholder="쉼표로 구분 (예: 스마일게이트, 펄어비스)"
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* 경력 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    경력 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer ${
                      errors.experience ? "border-red-500" : "border-card-border"
                    }`}
                  >
                    <option value="">선택해주세요</option>
                    {experienceOptions.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </select>
                  {errors.experience && <p className="mt-1 text-sm text-red-500">{errors.experience}</p>}
                </div>
              </div>
            </div>

            {/* 전문 분야 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                전문 분야 <span className="text-red-500">*</span>
              </h3>
              {errors.skills && <p className="mb-2 text-sm text-red-500">{errors.skills}</p>}
              <div className="space-y-4">
                {Object.entries(skillCategories).map(([key, category]) => (
                  <div key={key}>
                    <p className="text-sm text-muted mb-2">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                            formData.skills.includes(skill)
                              ? "bg-primary text-white"
                              : "bg-secondary text-muted hover:bg-secondary/80"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 상담 유형 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                상담 유형 <span className="text-red-500">*</span>
              </h3>
              {errors.consultTypes && <p className="mb-2 text-sm text-red-500">{errors.consultTypes}</p>}
              <div className="flex flex-wrap gap-3">
                {consultTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleConsultTypeToggle(option.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      formData.consultTypes.includes(option.value)
                        ? "bg-accent text-white"
                        : "bg-secondary text-muted hover:bg-secondary/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 상품/가격 관리 */}
            <div>
              <h3 className="text-lg font-semibold mb-2">상품 및 가격</h3>
              <p className="text-sm text-muted mb-4">
                제공할 멘토링 서비스와 가격을 설정하세요.
              </p>
              {errors.products && <p className="mb-2 text-sm text-red-500">{errors.products}</p>}

              <div className="space-y-4">
                {PRODUCT_TYPES.map((type) => {
                  const info = PRODUCT_INFO[type];
                  const limits = PRICE_LIMITS[type];
                  const recommended = RECOMMENDED_PRICES[type];
                  const setting = formData.products[type];
                  const currentTier = formData.experience ? getMentorTier(formData.experience) : "junior";
                  const tierAvailable = isProductAvailableForTier(type, currentTier);

                  return (
                    <div
                      key={type}
                      className={`border rounded-xl p-5 transition-all duration-300 ${
                        !tierAvailable
                          ? "border-card-border bg-secondary/20 opacity-60"
                          : setting.enabled
                            ? "border-primary bg-primary/5"
                            : "border-card-border bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <ProductIcon name={info.icon} className={`w-6 h-6 ${tierAvailable ? "text-primary" : "text-muted"}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{info.name}</p>
                              {!tierAvailable && (
                                <span className="text-[10px] px-2 py-0.5 bg-secondary border border-card-border rounded-full text-muted font-medium">
                                  시니어 이상
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted">
                              {tierAvailable ? `${info.description} (${info.duration}분)` : "경력 5년 이상 멘토만 제공 가능"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => tierAvailable && toggleProduct(type)}
                          disabled={!tierAvailable}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                            !tierAvailable ? "bg-secondary/50 cursor-not-allowed" : setting.enabled ? "bg-primary cursor-pointer" : "bg-secondary cursor-pointer"
                          }`}
                          role="switch"
                          aria-checked={setting.enabled}
                          aria-label={`${info.name} 활성화`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                              setting.enabled && tierAvailable ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {setting.enabled && (
                        <div className="mt-4 space-y-2">
                          <label className="block text-sm font-medium">
                            가격 (원)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                setting.price === ""
                                  ? ""
                                  : formatPrice(setting.price as number)
                              }
                              onChange={(e) => handlePriceChange(type, e.target.value)}
                              placeholder={`${formatPrice(limits.min)} ~ ${formatPrice(limits.max)}`}
                              className="w-full px-4 py-3 pr-10 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">
                              원
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>
                              설정 범위: {formatPrice(limits.min)}원 ~{" "}
                              {formatPrice(limits.max)}원
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  setting.price !== "" &&
                                  setting.price !== recommended &&
                                  !window.confirm(`현재 가격(${formatPrice(setting.price as number)}원)을 권장가(${formatPrice(recommended)}원)로 변경하시겠어요?`)
                                ) {
                                  return;
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  products: {
                                    ...prev.products,
                                    [type]: { ...prev.products[type], price: recommended },
                                  },
                                }));
                              }}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              권장가 {formatPrice(recommended)}원 적용
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 가능 시간 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  멘토링 가능 시간 <span className="text-muted font-normal text-sm">(선택)</span>
                </h3>
                {selectedCount > 0 && (
                  <span className="text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                    {selectedCount}개 선택됨
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mb-4">클릭하여 가능한 시간대를 선택해주세요.</p>

              <div className="overflow-x-auto -mx-2 px-2">
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${DAYS.length}, 1fr)` }}>
                  {/* Header row */}
                  <div className="w-16" />
                  {DAYS.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleAllDay(day.key)}
                      className={`w-11 h-8 text-xs font-semibold rounded-lg text-center cursor-pointer transition-colors ${
                        formData.availableTimes[day.key].length === TIME_SLOTS.length
                          ? "bg-primary text-white"
                          : formData.availableTimes[day.key].length > 0
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted hover:bg-secondary/80"
                      }`}
                      title={`${day.label}요일 전체 선택/해제`}
                    >
                      {day.label}
                    </button>
                  ))}

                  {/* Time rows */}
                  {TIME_SLOTS.map((time) => (
                    <React.Fragment key={time}>
                      <div className="w-16 text-xs text-muted flex items-center">
                        {time}
                      </div>
                      {DAYS.map((day) => {
                        const isSelected = formData.availableTimes[day.key].includes(time);
                        return (
                          <button
                            key={`${day.key}-${time}`}
                            type="button"
                            onClick={() => toggleTimeSlot(day.key, time)}
                            className={`w-11 h-8 rounded-lg text-xs cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary text-white shadow-sm"
                                : "bg-secondary/60 hover:bg-primary/10 text-transparent"
                            }`}
                          >
                            {isSelected ? "V" : "·"}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* 자기소개 */}
            <div>
              <label htmlFor="edit-bio" className="block text-sm font-medium mb-1.5">
                자기소개 <span className="text-muted">(선택)</span>
              </label>
              <textarea
                id="edit-bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="멘티들에게 자신을 소개해주세요"
                rows={4}
                maxLength={VALIDATION.MAX_BIO_LENGTH}
                aria-describedby="bio-char-count"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <div className="flex justify-end mt-1">
                <span
                  id="bio-char-count"
                  className={`text-xs ${
                    formData.bio.length > VALIDATION.MAX_BIO_LENGTH
                      ? "text-red-500"
                      : "text-muted"
                  }`}
                >
                  {formData.bio.length}/{VALIDATION.MAX_BIO_LENGTH}
                </span>
              </div>
            </div>

            {/* 상담 스타일 */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                상담 스타일 <span className="text-muted">(선택)</span>
              </label>
              <p className="text-xs text-muted mb-3">최대 {MAX_MENTORING_STYLES}개까지 선택 가능</p>
              <div className="flex flex-wrap gap-2">
                {MENTORING_STYLES.map((style) => {
                  const isSelected = formData.mentoringStyles.includes(style.value);
                  const isDisabled = !isSelected && formData.mentoringStyles.length >= MAX_MENTORING_STYLES;
                  return (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => handleMentoringStyleToggle(style.value)}
                      disabled={isDisabled}
                      title={style.description}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 text-primary border-primary/30"
                          : isDisabled
                            ? "bg-secondary/50 text-muted border-card-border opacity-50 cursor-not-allowed"
                            : "bg-secondary/50 text-muted border-card-border hover:border-primary/30"
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                저장 중...
              </span>
            ) : (
              "변경사항 저장"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
