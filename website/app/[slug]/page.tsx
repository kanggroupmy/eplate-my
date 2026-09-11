import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getLandingPage, landingPages } from "@/data/pages";
import { site } from "@/data/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return landingPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getLandingPage((await params).slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}/` },
    openGraph: {
      url: `/${page.slug}/`,
      title: page.title,
      description: page.description,
      images: ["/og-image.svg"]
    }
  };
}

export default async function LandingPage({ params }: Props) {
  const page = getLandingPage((await params).slug);
  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": page.slug.includes("price") ? "FAQPage" : "Service",
    name: page.h1,
    description: page.description,
    url: `${site.url}/${page.slug}/`,
    provider: {
      "@type": "AutomotiveBusiness",
      name: "ePlate.my",
      address: site.workshop.address,
      hasMap: site.workshop.mapUrl
    },
    offers: {
      "@type": "Offer",
      price: String(site.pricing.packagePrice),
      priceCurrency: "MYR"
    }
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <header className="hero">
        <div className="hero-inner">
          <Link className="eyebrow" href="/">ePlate.my</Link>
          <h1>{page.h1}</h1>
          <p className="hero-copy">{page.intro}</p>
          <div className="actions">
            <Link className="btn" href="/order">Start order</Link>
            <a className="btn-wire" href={site.workshop.mapUrl}>Open map</a>
          </div>
        </div>
      </header>
      <main>
        {page.sections.map((section) => (
          <section className="section narrow" key={section.title}>
            <div className="eyebrow">{section.eyebrow}</div>
            <h2>{section.title}</h2>
            <p className="muted">{section.body}</p>
            {section.bullets ? (
              <ul className="muted">
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            ) : null}
            {section.cta ? <Link className="btn" href={section.cta.href}>{section.cta.label}</Link> : null}
          </section>
        ))}
        {page.related ? (
          <section className="section narrow">
            <div className="eyebrow">Related</div>
            <h2>Nearby JPJePlate pages</h2>
            <div className="pill-row">
              {page.related.map((item) => (
                <Link className="pill" href={item.href} key={item.href}>{item.label}</Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
