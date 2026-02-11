import HomeClient from "@/components/HomeClient";
import JsonLd from "@/components/JsonLd";
import { SITE_CONFIG } from "@/lib/site-config";

export default function Home() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/opengraph-image`,
    description: SITE_CONFIG.description,
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE_CONFIG.contactEmail.support,
      contactType: "customer service",
      availableLanguage: "Korean",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/mentors?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "게임 업계 1:1 멘토링",
    provider: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
    },
    description:
      "현직 게임 개발자와 1:1 멘토링으로 게임 업계 취업과 커리어 성장을 도와드립니다. 커피챗, 이력서 리뷰, 모의면접 등 다양한 멘토링 서비스를 제공합니다.",
    serviceType: "Mentoring",
    areaServed: {
      "@type": "Country",
      name: "KR",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "멘토링 서비스",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "커피챗 (1:1 대화)",
            description: "현직 게임 개발자와 가볍게 커리어 상담",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "이력서/포트폴리오 리뷰",
            description: "현직자의 시각으로 이력서와 포트폴리오를 리뷰",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "모의면접",
            description: "실전과 같은 모의면접으로 면접 준비",
          },
        },
      ],
    },
  };

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={serviceJsonLd} />
      <HomeClient />
    </main>
  );
}
