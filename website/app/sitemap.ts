import type { MetadataRoute } from "next";
import { blogPosts } from "@/data/blog";
import { landingPages } from "@/data/pages";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-09-04");
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/order/`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${site.url}/blog/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...landingPages.map((page) => ({
      url: `${site.url}/${page.slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: page.priority
    })),
    ...blogPosts.map((post) => ({
      url: `${site.url}/blog/${post.slug}/`,
      lastModified: new Date(post.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
