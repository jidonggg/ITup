import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/auth/",
          "/mentor/dashboard",
          "/mentor/edit",
          "/mentor/settlement",
          "/mentor/earnings",
          "/mentor/feedback/",
          "/mypage",
          "/payment/",
          "/booking/",
          "/session/",
          "/review/write",
          "/onboarding",
          "/free-trial/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
