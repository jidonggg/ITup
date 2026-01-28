"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import Mentors from "@/components/Mentors";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import ConsultModal from "@/components/ConsultModal";
import MentorDetailModal, { MentorData } from "@/components/MentorDetailModal";
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

export default function HomeClient() {
  const router = useRouter();
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorData | null>(null);
  const [consultMentorId, setConsultMentorId] = useState<string | undefined>();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  // Handle auth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [router]);

  const openConsultModal = () => setIsConsultModalOpen(true);
  const closeConsultModal = () => {
    setIsConsultModalOpen(false);
    setConsultMentorId(undefined);
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
      <Hero onConsultClick={openConsultModal} />
      <Stats />
      <Features />
      <Mentors onMentorClick={openMentorModal} />
      <Testimonials />
      <Pricing onConsultClick={openConsultModal} />
      <CTA onConsultClick={openConsultModal} />
      <Footer />
      <ConsultModal isOpen={isConsultModalOpen} onClose={closeConsultModal} mentorId={consultMentorId} />
      <MentorDetailModal
        isOpen={isMentorModalOpen}
        onClose={closeMentorModal}
        mentor={selectedMentor}
        onConsultClick={() => {
          if (selectedMentor?.id) {
            setConsultMentorId(selectedMentor.id);
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
