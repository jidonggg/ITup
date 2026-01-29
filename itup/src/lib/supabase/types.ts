export type ConsultType = "coffee" | "resume" | "interview";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: "mentee" | "mentor" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Mentor {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  company: string;
  previous_companies: string[] | null;
  experience: string;
  skills: string[];
  bio: string | null;
  available_times: string[] | null;
  consult_types: ConsultType[];
  price: number | null;
  rating: number;
  sessions: number;
  reviews: number;
  is_approved: boolean;
  is_verified: boolean;
  verified_at: string | null;
  verification_method: "email" | "document" | null;
  verified_company: string | null;
  created_at: string;
}

export interface Consultation {
  id: string;
  mentor_id: string | null;
  user_id: string | null;
  user_name: string;
  user_phone: string;
  user_email: string;
  interest: string | null;
  preferred_time: string | null;
  message: string | null;
  payment_id: string | null;
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
  status: "pending" | "completed" | "failed" | "refunded";
  plan_type: string | null;
  payment_method: string | null;
  approved_at: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: "active" | "cancelled" | "expired";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  consultation_id: string;
  mentor_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
}

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
        Insert: Omit<Mentor, "id" | "created_at" | "rating" | "sessions" | "reviews" | "is_approved">;
        Update: Partial<Omit<Mentor, "id" | "created_at">>;
      };
      consultations: {
        Row: Consultation;
        Insert: Omit<Consultation, "id" | "created_at" | "status" | "has_review">;
        Update: Partial<Omit<Consultation, "id" | "created_at">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at">;
        Update: Partial<Omit<Review, "id" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at">;
        Update: Partial<Omit<Payment, "id" | "created_at">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at">;
        Update: Partial<Omit<Subscription, "id" | "created_at">>;
      };
      newsletter_subscriptions: {
        Row: NewsletterSubscription;
        Insert: Omit<NewsletterSubscription, "id" | "created_at">;
        Update: Partial<Omit<NewsletterSubscription, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
