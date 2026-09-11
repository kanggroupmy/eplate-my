import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, MapPin, MessageCircle, ShieldCheck, Upload } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { blogPosts } from "@/data/blog";
import { landingPages } from "@/data/pages";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "JPJePlate Installer Johor Bahru | ZEV/EV Eplate RM150 | ePlate.my",
  description: "Order JPJePlate for eligible ZEV/EV vehicles online with ePlate.my. RM150 installed service package at One Auto Motoring, Johor Bahru.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "JPJePlate Installer Johor Bahru | ePlate.my",
    description: "ZEV/EV JPJePlate order support and installation in Johor Bahru."
  }
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  name: "ePlate.my - JPJePlate Installer Johor Bahru",
  image: `${site.url}/og-image.svg`,
  description: "JPJePlate order support and installation in Johor Bahru for eligible ZEV/EV drivers.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "34, Jalan Permas 9/7, Permas Jaya",
    addressLocality: "Johor Bahru",
    addressRegion: "Johor",
    postalCode: "81750",
    addressCountry: "MY"
  },
  url: site.url,
  priceRange: "RM150",
  areaServed: [
    { "@type": "City", name: "Johor Bahru" },
    { "@type": "Place", name: "Skudai" },
    { "@type": "Place", name: "Tebrau" },
    { "@type": "Place", name: "Pasir Gudang" },
    { "@type": "Place", name: "Iskandar Puteri" }
  ],
  hasMap: site.workshop.mapUrl
};

export default function HomePage() {
  const featuredPages = landingPages.filter((page) =>
    ["jpjeplate-price-malaysia", "jpjeplate-installation-johor-bahru", "eplate-installer-johor-bahru", "jpjeplate-near-me"].includes(page.slug)
  );

  return (
    <>
      <JsonLd data={serviceJsonLd} />
      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow">ZEV/EV JPJePlate · Johor Bahru</div>
          <h1>Order your JPJePlate online, install in JB.</h1>
          <p className="hero-copy">
            ePlate.my handles eligible ZEV/EV JPJePlate orders with document upload, secure ToyyibPay payment, delivery coordination, and professional installation at One Auto Motoring in Permas Jaya.
          </p>
          <div className="actions">
            <Link className="btn" href="/order">Start order · RM150</Link>
            <Link className="btn-wire" href="#pricing">View price breakdown</Link>
          </div>
          <div className="plate" aria-label="JPJePlate visual preview">
            <div className="plate-my">MAL</div>
            <div className="plate-num">EV 2026</div>
            <div className="chip" />
          </div>
        </div>
      </header>

      <div className="trust">
        <div>ZEV/EV eligibility checked</div>
        <div>RM98 official set separated from service fee</div>
        <div>Private document uploads</div>
        <div>Johor Bahru installation</div>
      </div>

      <section className="section narrow" id="pricing">
        <div className="eyebrow">Pricing</div>
        <h2>One installed service package.</h2>
        <p className="muted">
          The official JPJePlate set price is RM{site.pricing.officialPlatePrice}. ePlate.my&apos;s RM{site.pricing.packagePrice} package is a local installed service package for eligible ZEV/EV orders.
        </p>
        <div className="grid two">
          <div className="panel">
            <div className="small">ePlate.my package</div>
            <div className="price">RM{site.pricing.packagePrice}</div>
            <p className="muted">Order support, document review, delivery coordination, invoice handling, and installation.</p>
            <Link className="btn-dark" href="/order">Order online</Link>
          </div>
          <div className="panel">
            <div className="small">What is included</div>
            <ul className="muted">
              <li>Front and rear JPJePlate set for eligible ZEV/EV orders.</li>
              <li>Private VOC/geran and MyKad uploads, with secure online payment.</li>
              <li>Status tracking and appointment scheduling.</li>
              <li>Installation at {site.workshop.name}.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Process</div>
        <h2>Six steps from order to installation.</h2>
        <div className="grid">
          {[
            { title: "Eligibility", body: "Confirm the vehicle is a ZEV/EV currently eligible for JPJePlate ordering.", Icon: ShieldCheck },
            { title: "Order details", body: "Enter owner name, WhatsApp number, registration number, and chassis/VIN.", Icon: FileText },
            { title: "Documents", body: "Upload VOC/geran and MyKad through the private customer dashboard.", Icon: Upload },
            { title: "Secure payment", body: "Pay through ToyyibPay and track confirmation in your account.", Icon: CheckCircle2 },
            { title: "Admin updates", body: "Our team submits the order and keeps the status pipeline updated.", Icon: MessageCircle },
            { title: "Installation", body: "Book a workshop slot after the plate arrives in Permas Jaya.", Icon: MapPin }
          ].map(({ title, body, Icon }) => (
            <div className="card" key={String(title)}>
              <Icon aria-hidden size={22} color="#C62828" />
              <h3>{title}</h3>
              <p className="muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section narrow">
        <div className="eyebrow">Location</div>
        <h2>Install at our Johor Bahru workshop.</h2>
        <div className="panel">
          <strong>{site.workshop.label}</strong>
          <p className="muted">{site.workshop.address}</p>
          <p className="small">{site.workshop.hours}</p>
          <div className="actions">
            <Link className="btn" href="/order">Start order</Link>
            <a className="btn-light" href={site.workshop.mapUrl}>Open Google Maps</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Popular searches</div>
        <h2>JPJePlate pages for Johor drivers.</h2>
        <div className="grid two">
          {featuredPages.map((page) => (
            <Link className="card" href={`/${page.slug}/`} key={page.slug}>
              <div className="eyebrow">{page.eyebrow}</div>
              <h3>{page.h1}</h3>
              <p className="muted">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Guides</div>
        <h2>Helpful JPJePlate reading.</h2>
        <div className="grid">
          {blogPosts.slice(0, 3).map((post) => (
            <Link className="card" href={`/blog/${post.slug}/`} key={post.slug}>
              <div className="eyebrow">{post.category}</div>
              <h3>{post.title}</h3>
              <p className="muted">{post.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
