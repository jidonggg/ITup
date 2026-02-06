import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://itup.vercel.app";

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
          "/mypage",
          "/payment/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
