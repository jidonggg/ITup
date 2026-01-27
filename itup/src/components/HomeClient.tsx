"use client";

import { useState } from "react";
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

export default function HomeClient() {
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorData | null>(null);

  const openConsultModal = () => setIsConsultModalOpen(true);
  const closeConsultModal = () => setIsConsultModalOpen(false);

  const openMentorModal = (mentor: MentorData) => {
    setSelectedMentor(mentor);
    setIsMentorModalOpen(true);
  };
  const closeMentorModal = () => {
    setIsMentorModalOpen(false);
    setSelectedMentor(null);
  };

  return (
    <>
      <Header />
      <Hero onConsultClick={openConsultModal} />
      <Stats />
      <Features />
      <Mentors onMentorClick={openMentorModal} />
      <Testimonials />
      <Pricing />
      <CTA onConsultClick={openConsultModal} />
      <Footer />
      <ConsultModal isOpen={isConsultModalOpen} onClose={closeConsultModal} />
      <MentorDetailModal
        isOpen={isMentorModalOpen}
        onClose={closeMentorModal}
        mentor={selectedMentor}
        onConsultClick={openConsultModal}
      />
    </>
  );
}
