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
import PaymentModal from "@/components/PaymentModal";
import { ProductType, BundleInfo, bundles } from "@/lib/payment/types";

export default function HomeClient() {
  const router = useRouter();
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorData | null>(null);
  const [consultMentor, setConsultMentor] = useState<MentorData | null>(null);
  const [consultMentorId, setConsultMentorId] = useState<string | undefined>();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundleInfo | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | undefined>();

  // Handle auth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [router]);

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

  const openBundleModal = (bundleId: string) => {
    const bundle = bundles.find((b) => b.id === bundleId);
    if (bundle) {
      setSelectedBundle(bundle);
      setIsPaymentModalOpen(true);
    }
  };
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedBundle(null);
  };

  return (
    <>
      <Header onLoginClick={openLoginModal} onSignupClick={openSignupModal} />
      <Hero onConsultClick={() => openConsultModal()} />
      <Stats />
      <Features />
      <Mentors onMentorClick={openMentorModal} />
      <Testimonials />
      <Pricing
        onConsultClick={() => openConsultModal()}
        onProductClick={(productId) => openConsultModal(productId)}
        onBundleClick={openBundleModal}
      />
      <CTA onConsultClick={() => openConsultModal()} />
      <Footer />
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
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        bundle={selectedBundle}
      />
    </>
  );
}
