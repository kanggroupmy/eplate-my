import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "JPJePlate Malaysia Guides | ePlate.my Blog",
  description: "Latest JPJePlate Malaysia news and practical guides covering eligibility, pricing, documents, rollout updates and installation support.",
  alternates: { canonical: "/blog/" }
};

export default function BlogIndex() {
  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow">Guides</div>
          <h1>JPJePlate news and guides for Malaysian drivers</h1>
          <p className="hero-copy">Clear updates on the JPJePlate rollout, pricing, documents, eligibility and installation in Johor Bahru.</p>
        </div>
      </header>
      <main className="section">
        <div className="grid two">
          {blogPosts.map((post) => (
            <Link className="card" href={`/blog/${post.slug}/`} key={post.slug}>
              <div className="eyebrow">{post.category}</div>
              <h2>{post.title}</h2>
              <p className="muted">{post.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
