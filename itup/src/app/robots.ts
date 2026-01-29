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
          "/mypage",
          "/payment/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
