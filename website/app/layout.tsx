import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { site } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "JPJePlate Installer Johor Bahru | ePlate.my",
    template: "%s"
  },
  description: "Order JPJePlate for eligible ZEV/EV vehicles online with ePlate.my. RM150 installed service package in Johor Bahru.",
  openGraph: {
    siteName: "ePlate.my",
    locale: "en_MY",
    type: "website",
    images: ["/og-image.svg"]
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-MY">
      <body>
        <Nav />
        {process.env.APP_ENV === 'sandbox' && <aside role="status" style={{ padding: '16px', background: '#fff3cd', color: '#332701', textAlign: 'center' }}><strong>SANDBOX — test orders only.</strong> No real payments or installation bookings. Use sample documents only.</aside>}
        {children}
        <Footer />
      </body>
    </html>
  );
}
