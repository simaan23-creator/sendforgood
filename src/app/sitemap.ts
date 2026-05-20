import type { MetadataRoute } from "next";

const SITE = "https://sealtheday.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Public, indexable marketing + content pages. Wedding vault is the
  // primary product; digital messages + audio + video remain available
  // via /messages/buy. Physical gifts and physical letters are
  // discontinued and intentionally excluded from the sitemap so they
  // are not surfaced to search traffic.
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
