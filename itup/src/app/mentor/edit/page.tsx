"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { skillCategories } from "@/data/mentors";

type ConsultType = "coffee" | "resume" | "interview";

const consultTypeOptions: { value: ConsultType; label: string }[] = [
  { value: "coffee", label: "커피챗" },
  { value: "resume", label: "이력서/포트폴리오" },
  { value: "interview", label: "모의면접" },
];

const experienceOptions = [
  "1년 미만",
  "1-3년",
  "3-5년",
  "5-7년",
  "7-10년",
  "10년 이상",
];

interface FormData {
  name: string;
  company: string;
  role: string;
  previousCompanies: string;
  experience: string;
  skills: string[];
  consultTypes: ConsultType[];
  availableTimes: string;
  bio: string;
}

const initialFormData: FormData = {
  name: "",
  company: "",
  role: "",
  previousCompanies: "",
  experience: "",
  skills: [],
  consultTypes: [],
  availableTimes: "",
  bio: "",
};

export default function MentorEditPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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
      setFormData({
        name: data.name || "",
        company: data.company || "",
        role: data.role || "",
        previousCompanies: (data.previous_companies || []).join(", "),
        experience: data.experience || "",
        skills: data.skills || [],
        consultTypes: (data.consult_types || []) as ConsultType[],
        availableTimes: (data.available_times || []).join(", "),
        bio: data.bio || "",
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

      const availableTimesArray = formData.availableTimes
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

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
          available_times: availableTimesArray,
          consult_types: formData.consultTypes,
        })
        .eq("id", mentorId);

      if (error) {
        console.error("Error updating mentor:", error);
        alert("프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Error updating mentor:", error);
      alert("프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          <h2 className="text-2xl font-bold mb-2">로그인이 필요합니다</h2>
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
            href="/mentor/register"
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

            {/* 가능 시간 */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                멘토링 가능 시간 <span className="text-muted">(선택)</span>
              </label>
              <input
                type="text"
                name="availableTimes"
                value={formData.availableTimes}
                onChange={handleChange}
                placeholder="쉼표로 구분 (예: 평일 저녁 7-10시, 주말 오후 2-6시)"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* 자기소개 */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                자기소개 <span className="text-muted">(선택)</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="멘티들에게 자신을 소개해주세요"
                rows={4}
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
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
