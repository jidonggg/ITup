"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import Mentors from "@/components/Mentors";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FreeTrialBanner from "@/components/FreeTrialBanner";
import SocialProofPopup from "@/components/SocialProofPopup";
import SeasonalBanner from "@/components/SeasonalBanner";
import NewsletterCaptureBar from "@/components/NewsletterCaptureBar";
import dynamic from "next/dynamic";
import type { MentorData } from "@/components/MentorDetailModal";

const ConsultModal = dynamic(() => import("@/components/ConsultModal"), { ssr: false });
const MentorDetailModal = dynamic(() => import("@/components/MentorDetailModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/auth/LoginModal"), { ssr: false });
const SignupModal = dynamic(() => import("@/components/auth/SignupModal"), { ssr: false });
const ForgotPasswordModal = dynamic(() => import("@/components/auth/ForgotPasswordModal"), { ssr: false });
import { ProductType } from "@/lib/payment/types";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function HomeClient() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorData | null>(null);
  const [consultMentor, setConsultMentor] = useState<MentorData | null>(null);
  const [consultMentorId, setConsultMentorId] = useState<string | undefined>();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | undefined>();

  // Handle auth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [router]);

  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role !== "mentee") return;

    const checkOnboarding = async () => {
      if (!isSupabaseConfigured()) return;

      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("preferences, onboarded_at")
        .eq("id", user.id)
        .single();

      if (data && !data.onboarded_at) {
        router.push("/onboarding");
      }
    };

    checkOnboarding();
  }, [user, profile, router]);

  const openConsultModal = (productType?: ProductType) => {
    setSelectedProductType(productType);
    setIsConsultModalOpen(true);
  };
  const closeConsultModal = () => {
    setIsConsultModalOpen(false);
    setConsultMentorId(undefined);
    setConsultMentor(null);
    setSelectedProductType(undefined);
  };

  const openMentorModal = (mentor: MentorData) => {
    setSelectedMentor(mentor);
    setIsMentorModalOpen(true);
  };
  const closeMentorModal = () => {
    setIsMentorModalOpen(false);
    setSelectedMentor(null);
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openSignupModal = () => setIsSignupModalOpen(true);
  const closeSignupModal = () => setIsSignupModalOpen(false);

  const switchToSignup = () => {
    closeLoginModal();
    openSignupModal();
  };

  const switchToLogin = () => {
    closeSignupModal();
    closeForgotPasswordModal();
    openLoginModal();
  };

  const openForgotPasswordModal = () => setIsForgotPasswordModalOpen(true);
  const closeForgotPasswordModal = () => setIsForgotPasswordModalOpen(false);

  const switchToForgotPassword = () => {
    closeLoginModal();
    openForgotPasswordModal();
  };

  return (
    <>
      <Header onLoginClick={openLoginModal} onSignupClick={openSignupModal} />
      <SeasonalBanner />
      <Hero />
      <Stats />
      <Features />
      <FreeTrialBanner />
      <Mentors onMentorClick={openMentorModal} />
      <Pricing
        onConsultClick={() => openConsultModal()}
        onProductClick={(productId) => openConsultModal(productId)}
      />
      <Testimonials />
      <NewsletterCaptureBar />
      <CTA onConsultClick={() => openConsultModal()} />
      <Footer />
      <SocialProofPopup />
      <ConsultModal
        isOpen={isConsultModalOpen}
        onClose={closeConsultModal}
        mentorId={consultMentorId}
        mentorName={consultMentor?.name}
        mentorAvailableTimes={consultMentor?.availableTimes}
        mentorExperience={consultMentor?.experience}
        productType={selectedProductType}
      />
      <MentorDetailModal
        isOpen={isMentorModalOpen}
        onClose={closeMentorModal}
        mentor={selectedMentor}
        onConsultClick={() => {
          if (selectedMentor) {
            setConsultMentorId(selectedMentor.id);
            setConsultMentor(selectedMentor);
          }
          closeMentorModal();
          openConsultModal();
        }}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSwitchToSignup={switchToSignup}
        onSwitchToForgotPassword={switchToForgotPassword}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={closeSignupModal}
        onSwitchToLogin={switchToLogin}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={closeForgotPasswordModal}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
}
