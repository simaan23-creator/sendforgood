import type { MetadataRoute } from "next";

const SITE = "https://sealtheday.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Public, indexable marketing + content pages.
  const routes = [
    "",
    "/about",
    "/pricing",
    "/contact",
    "/blog",
    "/terms",
    "/privacy",
    "/start",
    "/send",
    "/gifts",
    "/gifts/buy",
    "/gifts/give",
    "/gifts/assign",
    "/letters",
    "/letters/write",
    "/voice",
    "/voice/record",
    "/messages/buy",
    "/vault",
    "/vault/wedding-kit",
    "/wedding",
    "/business",
    "/request",
    "/request/create",
  ];

  return routes.map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1.0 : 0.7,
  }));
}
