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
        {children}
        <Footer />
      </body>
    </html>
  );
}
