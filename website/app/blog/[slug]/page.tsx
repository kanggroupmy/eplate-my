import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { blogPosts, getBlogPost } from "@/data/blog";
import { site } from "@/data/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} | ePlate.my`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}/` },
    openGraph: {
      url: `/blog/${post.slug}/`,
      title: post.title,
      description: post.description,
      images: [post.image?.src || "/og-image.svg"]
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: "ePlate.my" },
    publisher: {
      "@type": "Organization",
      name: "ePlate.my",
      logo: { "@type": "ImageObject", url: `${site.url}/og-image.svg` }
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    mainEntityOfPage: `${site.url}/blog/${post.slug}/`,
    ...(post.image ? { image: `${site.url}${post.image.src}` } : {}),
    ...(post.citation ? { citation: post.citation } : {})
  };

  const faqJsonLd = post.faqs ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  } : null;

  return (
    <>
      <JsonLd data={jsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <header className="hero">
        <div className="hero-inner">
          <Link className="eyebrow" href="/blog/">{post.category}</Link>
          <h1>{post.title}</h1>
          <p className="hero-copy">{post.description}</p>
          <time className="article-date" dateTime={post.datePublished}>Published {new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${post.datePublished}T00:00:00+08:00`))}</time>
        </div>
      </header>
      <main className="article">
        {post.image ? (
          <figure className="article-figure">
            <Image
              src={post.image.src}
              alt={post.image.alt}
              width={post.image.width}
              height={post.image.height}
              sizes="(max-width: 760px) 100vw, 760px"
              priority
            />
            <figcaption>{post.image.caption}</figcaption>
          </figure>
        ) : null}
        {post.citation ? (
          <p className="notice">
            Primary source: <a href={post.citation} rel="noopener noreferrer">{post.citationLabel || post.citation}</a>
            {post.secondaryCitation ? <> · Secondary reporting: <a href={post.secondaryCitation} rel="noopener noreferrer">{post.secondaryCitationLabel || post.secondaryCitation}</a></> : null}.
            {" "}The information has been independently summarised and analysed by ePlate.my.
          </p>
        ) : null}
        {post.sections.map((section, index) => (
          <section key={`${section.heading || "intro"}-${index}`}>
            {section.heading ? <h2>{section.heading}</h2> : null}
            <p>{section.body}</p>
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            ) : null}
          </section>
        ))}
        {post.faqs ? (
          <section>
            <h2>Frequently asked questions</h2>
            {post.faqs.map((faq) => (
              <div className="faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </section>
        ) : null}
        <div className="panel">
          <strong>Ready to order?</strong>
          <p className="muted">ePlate.my accepts eligible ZEV/EV JPJePlate orders for installation in Johor Bahru.</p>
          <Link className="btn" href="/order">Start order</Link>
        </div>
      </main>
    </>
  );
}
