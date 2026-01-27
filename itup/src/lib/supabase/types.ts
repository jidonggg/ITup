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
  rating: number;
  sessions: number;
  reviews: number;
  is_approved: boolean;
  created_at: string;
}

export interface Consultation {
  id: string;
  mentor_id: string | null;
  user_name: string;
  user_phone: string;
  user_email: string;
  interest: string | null;
  message: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
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
        Insert: Omit<Consultation, "id" | "created_at" | "status">;
        Update: Partial<Omit<Consultation, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
