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

export default function HomeClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <Header />
      <Hero onConsultClick={openModal} />
      <Stats />
      <Features />
      <Mentors />
      <Testimonials />
      <Pricing />
      <CTA onConsultClick={openModal} />
      <Footer />
      <ConsultModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
