// =============================================
// ITup v2 — Database Types
// =============================================

// -- Enum types --

export type ConsultType = "coffee" | "resume" | "interview";

export type ProductType = "coffee_chat" | "document_review" | "mock_interview" | "free_trial";

export type JobType = "client" | "server" | "planner" | "artist" | "other";

export type EngineType = "unity" | "unreal" | "other";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type VerificationMethod = "email" | "document";

export type BookingStatus = "pending" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded";

export type ConfirmationType = "completed" | "mentee_noshow" | "mentor_noshow" | "issue";

export type SessionFinalStatus = "completed" | "mentee_noshow" | "mentor_noshow" | "disputed";

export type NoshowType = "mentee_noshow" | "mentor_noshow";

export type CancelledBy = "mentee" | "mentor" | "admin";

// -- Table types --

export interface OnboardingPreferences {
  job_type?: JobType;
  engine?: EngineType;
  mentoring_type?: ProductType;
}

export type SettlementStatus = "pending" | "processing" | "completed" | "failed";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: "mentee" | "mentor" | "admin";
  preferences: OnboardingPreferences | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mentor {
  id: string;
  user_id: string | null;
  name: string;
  company: string;
  position: string | null;
  years: number | null;
  experience: string;
  job_type: JobType | null;
  engine: EngineType | null;
  role: string;
  skills: string[];
  bio: string | null;
  profile_image_url: string | null;

  // 검증
  verification_status: VerificationStatus;
  verification_method: VerificationMethod | null;
  verified_email: string | null;
  verified_company: string | null;
  verified_at: string | null;
  is_verified: boolean;

  // 경력
  previous_companies: string[] | null;
  previous_companies_detail: PreviousCompany[];

  // 상태
  is_approved: boolean;
  is_active: boolean;

  // 레거시 호환
  available_times: string[] | null;
  consult_types: ConsultType[];
  price: number | null;
  contact_method: string | null;

  // 통계
  rating: number;
  sessions: number;
  reviews: number;

  created_at: string;
}

export interface PreviousCompany {
  company_name: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  years?: number;
}

export interface Product {
  id: string;
  mentor_id: string;
  type: ProductType;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MentorSchedule {
  id: string;
  mentor_id: string;
  day_of_week: number; // 0-6 (일-토)
  start_time: string;  // "HH:mm:ss"
  end_time: string;    // "HH:mm:ss"
  is_active: boolean;
  created_at: string;
}

export interface MentorUnavailable {
  id: string;
  mentor_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  mentee_id: string | null;
  mentor_id: string;
  product_id: string | null;
  scheduled_at: string;
  status: BookingStatus;

  // 멘티 신청 정보
  mentee_intro: string | null;
  mentee_goal: string | null;
  meeting_link: string | null;
  attached_files: AttachedFile[];

  // 결제 정보
  payment_key: string | null;
  order_id: string | null;
  amount: number;
  platform_fee: number;
  mentor_amount: number;
  payment_method: string | null;
  paid_at: string | null;

  // 취소 정보
  cancelled_at: string | null;
  cancelled_by: CancelledBy | null;
  cancel_reason: string | null;
  refund_amount: number;
  refunded_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface AttachedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface SessionConfirmation {
  id: string;
  booking_id: string;

  mentor_confirmed: "completed" | "mentee_noshow" | "issue" | null;
  mentor_confirmed_at: string | null;
  mentor_note: string | null;

  mentee_confirmed: "completed" | "mentor_noshow" | "issue" | null;
  mentee_confirmed_at: string | null;
  mentee_note: string | null;

  final_status: SessionFinalStatus | null;
  resolved_at: string | null;
  resolved_by: string | null;

  created_at: string;
  updated_at: string;
}

export interface MentorFeedback {
  id: string;
  booking_id: string;
  mentor_id: string;
  mentee_id: string | null;
  content: string;
  created_at: string;
}

export interface NoshowRecord {
  id: string;
  user_id: string;
  booking_id: string | null;
  noshow_type: NoshowType;
  created_at: string;
}

export interface VerifiedDomain {
  id: string;
  domain: string;
  company_name: string;
  is_active: boolean;
  created_at: string;
}

// -- 레거시 테이블 (기존 호환) --

export interface Consultation {
  id: string;
  mentor_id: string | null;
  user_id: string | null;
  user_name: string;
  user_phone: string;
  user_email: string;
  interest: string | null;
  product_type: ConsultType | null;
  preferred_time: string | null;
  message: string | null;
  payment_id: string | null;
  expected_amount: number | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  has_review: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string | null;
  consultation_id: string | null;
  order_id: string;
  payment_key: string | null;
  amount: number;
  platform_fee: number | null;
  mentor_amount: number | null;
  status: "pending" | "completed" | "failed" | "refunded" | "partial_refunded";
  product_type: string | null;
  bundle_type: string | null;
  payment_method: string | null;
  approved_at: string | null;
  receipt_url: string | null;
  raw_response: Record<string, unknown> | null;
  refund_reason: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string | null;
  consultation_id: string | null;
  mentor_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
}

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  user_id: string | null;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface BusinessInquiry {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  employee_count: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

// -- 정산 테이블 --

export interface MentorBankAccount {
  id: string;
  mentor_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  id: string;
  mentor_id: string;
  bank_account_id: string | null;
  period_start: string;
  period_end: string;
  booking_ids: string[];
  total_amount: number;
  platform_fee: number;
  settlement_amount: number;
  commission_rate: number;
  status: SettlementStatus;
  failure_reason: string | null;
  settled_at: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
}

// -- Session Reminders (Cron) --

export type ReminderType = "24h" | "1h";

export interface SessionReminder {
  id: string;
  booking_id: string;
  reminder_type: ReminderType;
  email_sent: boolean;
  alimtalk_sent: boolean;
  error_message: string | null;
  sent_at: string;
  created_at: string;
}

// -- View types --

export interface MentorStats {
  mentor_id: string;
  name: string;
  company: string;
  completed_sessions: number;
  review_count: number;
  avg_rating: number;
  min_price: number | null;
  max_price: number | null;
}

// -- Database type (Supabase 호환) --

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      mentors: {
        Row: Mentor;
        Insert: Omit<Mentor, "id" | "created_at" | "rating" | "sessions" | "reviews" | "is_approved" | "is_active" | "verification_status">;
        Update: Partial<Omit<Mentor, "id" | "created_at">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Product, "id" | "created_at">>;
      };
      mentor_schedules: {
        Row: MentorSchedule;
        Insert: Omit<MentorSchedule, "id" | "created_at">;
        Update: Partial<Omit<MentorSchedule, "id" | "created_at">>;
      };
      mentor_unavailable: {
        Row: MentorUnavailable;
        Insert: Omit<MentorUnavailable, "id" | "created_at">;
        Update: Partial<Omit<MentorUnavailable, "id" | "created_at">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at" | "updated_at" | "status" | "platform_fee" | "mentor_amount" | "refund_amount">;
        Update: Partial<Omit<Booking, "id" | "created_at">>;
      };
      session_confirmations: {
        Row: SessionConfirmation;
        Insert: Omit<SessionConfirmation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SessionConfirmation, "id" | "created_at">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at">;
        Update: Partial<Omit<Review, "id" | "created_at">>;
      };
      mentor_feedbacks: {
        Row: MentorFeedback;
        Insert: Omit<MentorFeedback, "id" | "created_at">;
        Update: Partial<Omit<MentorFeedback, "id" | "created_at">>;
      };
      noshow_records: {
        Row: NoshowRecord;
        Insert: Omit<NoshowRecord, "id" | "created_at">;
        Update: Partial<Omit<NoshowRecord, "id" | "created_at">>;
      };
      verified_domains: {
        Row: VerifiedDomain;
        Insert: Omit<VerifiedDomain, "id" | "created_at">;
        Update: Partial<Omit<VerifiedDomain, "id" | "created_at">>;
      };
      mentor_bank_accounts: {
        Row: MentorBankAccount;
        Insert: Omit<MentorBankAccount, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<MentorBankAccount, "id" | "created_at">>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Settlement, "id" | "created_at">>;
      };
      session_reminders: {
        Row: SessionReminder;
        Insert: Omit<SessionReminder, "id" | "created_at" | "sent_at">;
        Update: Partial<Omit<SessionReminder, "id" | "created_at">>;
      };
      // 레거시
      consultations: {
        Row: Consultation;
        Insert: Omit<Consultation, "id" | "created_at" | "status" | "has_review" | "payment_id">;
        Update: Partial<Omit<Consultation, "id" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at">;
        Update: Partial<Omit<Payment, "id" | "created_at">>;
      };
      verification_codes: {
        Row: VerificationCode;
        Insert: Omit<VerificationCode, "id" | "created_at">;
        Update: Partial<Omit<VerificationCode, "id" | "created_at">>;
      };
      newsletter_subscriptions: {
        Row: NewsletterSubscription;
        Insert: Omit<NewsletterSubscription, "id" | "created_at">;
        Update: Partial<Omit<NewsletterSubscription, "id" | "created_at">>;
      };
      business_inquiries: {
        Row: BusinessInquiry;
        Insert: Omit<BusinessInquiry, "id" | "created_at" | "status">;
        Update: Partial<Omit<BusinessInquiry, "id" | "created_at">>;
      };
    };
    Views: {
      mentor_stats: {
        Row: MentorStats;
      };
    };
    Functions: {
      get_noshow_count: {
        Args: { p_user_id: string; p_months?: number };
        Returns: number;
      };
      cleanup_expired_verification_codes: {
        Args: Record<string, never>;
        Returns: void;
      };
      auto_complete_unconfirmed_sessions: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
