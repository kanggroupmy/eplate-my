import { site } from "./site";

export type LandingPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: Array<{
    eyebrow: string;
    title: string;
    body: string;
    bullets?: string[];
    cta?: { label: string; href: string };
  }>;
  related?: Array<{ label: string; href: string }>;
  priority: number;
};

const workshopCopy = `Installation is handled at ${site.workshop.name}, ${site.workshop.address}.`;

export const landingPages: LandingPage[] = [
  {
    slug: "johor-bahru",
    title: "JPJePlate Johor Bahru Installation | ePlate.my",
    description: "Order JPJePlate electronic number plates in Johor Bahru with ePlate.my. ZEV/EV installation at One Auto Motoring, Permas Jaya.",
    eyebrow: "Johor Bahru",
    h1: "JPJePlate installation in Johor Bahru",
    intro: "Order your ZEV/EV electronic number plate online and install it at our Permas Jaya workshop once it arrives.",
    sections: [
      {
        eyebrow: "Local service",
        title: "JPJePlate help for JB EV drivers",
        body: `ePlate.my supports Johor Bahru ZEV/EV owners with document checking, secure ToyyibPay payment, WhatsApp updates, and professional fitting. ${workshopCopy}`,
        cta: { label: "Start order", href: "/order" }
      },
      {
        eyebrow: "Process",
        title: "Order online, fit in JB",
        body: "Complete the order steps online first, then visit the workshop only when your JPJePlate is ready.",
        bullets: ["Confirm ZEV/EV eligibility.", "Upload VOC/geran and MyKad.", "Pay securely through ToyyibPay.", "Book installation after the plate arrives."]
      }
    ],
    related: [
      { label: "Skudai", href: "/skudai/" },
      { label: "Tebrau", href: "/tebrau/" },
      { label: "Pasir Gudang", href: "/pasir-gudang/" },
      { label: "Iskandar Puteri", href: "/iskandar-puteri/" }
    ],
    priority: 0.9
  },
  {
    slug: "skudai",
    title: "JPJePlate Skudai | ePlate.my Installation in Johor Bahru",
    description: "JPJePlate ordering for Skudai ZEV/EV drivers. ePlate.my handles online order support and installation at One Auto Motoring, Permas Jaya.",
    eyebrow: "Skudai",
    h1: "JPJePlate for Skudai EV drivers",
    intro: "Order from Skudai online, then install your eplate at our Permas Jaya workshop in Johor Bahru.",
    sections: [
      {
        eyebrow: "Prepare",
        title: "Avoid an extra workshop trip",
        body: "Skudai drivers can complete eligibility, documents, and payment online before travelling for installation.",
        bullets: ["Vehicle registration number and chassis/VIN.", "VOC/geran and MyKad photos.", "Secure payment through ToyyibPay.", "Preferred appointment timing once the plate arrives."],
        cta: { label: "Order online", href: "/order" }
      }
    ],
    priority: 0.8
  },
  {
    slug: "tebrau",
    title: "JPJePlate Tebrau | ePlate.my Johor Bahru Installation",
    description: "JPJePlate service for Tebrau ZEV/EV drivers. Order online with ePlate.my and install at One Auto Motoring in Permas Jaya.",
    eyebrow: "Tebrau",
    h1: "JPJePlate for Tebrau EV drivers",
    intro: "A direct online order flow for Tebrau drivers with installation at our Permas Jaya workshop.",
    sections: [
      {
        eyebrow: "Included",
        title: "RM150 ePlate.my installed package",
        body: "The official JPJePlate set is RM98; ePlate.my's RM150 package is a local installed service package for eligible ZEV/EV vehicles.",
        bullets: ["Order guidance and document checking.", "Secure ToyyibPay checkout.", "Delivery coordination to the JB workshop.", "Professional installation and invoice."]
      }
    ],
    priority: 0.8
  },
  {
    slug: "pasir-gudang",
    title: "JPJePlate Pasir Gudang | ePlate.my Johor Installation",
    description: "JPJePlate ordering for Pasir Gudang ZEV/EV drivers. ePlate.my provides online order support and installation at One Auto Motoring, Permas Jaya.",
    eyebrow: "Pasir Gudang",
    h1: "JPJePlate for Pasir Gudang EV drivers",
    intro: "Order online from Pasir Gudang and install when your eplate reaches our Johor Bahru workshop.",
    sections: [
      {
        eyebrow: "Process",
        title: "Simple order flow",
        body: "Pasir Gudang drivers can complete the order steps before making the trip to Permas Jaya.",
        bullets: ["Confirm your vehicle is ZEV/EV eligible.", "Upload VOC/geran and MyKad.", "Pay securely through ToyyibPay.", "Drive to Permas Jaya after arrival notification."],
        cta: { label: "Start by order form", href: "/order" }
      }
    ],
    priority: 0.8
  },
  {
    slug: "iskandar-puteri",
    title: "JPJePlate Iskandar Puteri | ePlate.my Johor Bahru Installation",
    description: "JPJePlate ordering for Iskandar Puteri ZEV/EV drivers. ePlate.my provides online updates and installation in Permas Jaya, Johor Bahru.",
    eyebrow: "Iskandar Puteri",
    h1: "JPJePlate for Iskandar Puteri EV drivers",
    intro: "Clear pricing, online document upload, and installation at our Johor Bahru workshop.",
    sections: [
      {
        eyebrow: "Why ePlate.my",
        title: "One local contact point",
        body: "Complete the order online and keep one local workshop contact for fitting and follow-up.",
        bullets: ["RM150 installed package shown upfront.", "ZEV/EV eligibility confirmed first.", "Document guidance and payment confirmation.", "Installation handled in Johor Bahru."]
      }
    ],
    priority: 0.8
  },
  {
    slug: "jpjeplate-price-malaysia",
    title: "JPJePlate Price Malaysia | RM150 Installed Package | ePlate.my",
    description: "JPJePlate price Malaysia guide. Learn the official RM98 plate price, what ePlate.my's RM150 installed package includes, and how to order in Johor Bahru.",
    eyebrow: "Price",
    h1: "JPJePlate price in Malaysia",
    intro: "A clear price guide for drivers comparing official JPJePlate pricing and installed service packages.",
    sections: [
      {
        eyebrow: "Price",
        title: "Official plate price vs installed service package",
        body: "The official JPJePlate set price is RM98. ePlate.my's RM150 package is a local installed package that includes order support, delivery coordination to the workshop, payment confirmation, invoice handling, and installation.",
        cta: { label: "Order online", href: "/order" }
      },
      {
        eyebrow: "Eligibility",
        title: "V1 accepts ZEV/EV JPJePlate orders",
        body: "JPJePlate is currently positioned around the ZEV/EV rollout. ePlate.my verifies ZEV/EV eligibility before accepting a completed order."
      }
    ],
    priority: 0.9
  },
  {
    slug: "jpjeplate-installation-johor-bahru",
    title: "JPJePlate Installation Johor Bahru | ePlate.my",
    description: "Order JPJePlate online, upload documents, pay through ToyyibPay, and install at One Auto Motoring in Johor Bahru.",
    eyebrow: "Installation",
    h1: "JPJePlate installation in Johor Bahru",
    intro: "Order online, receive status updates, and fit your eplate at our Permas Jaya workshop.",
    sections: [
      {
        eyebrow: "Installation",
        title: "Professional fitting at One Auto Motoring",
        body: workshopCopy,
        cta: { label: "Open order form", href: "/order" }
      },
      {
        eyebrow: "Steps",
        title: "How installation works",
        body: "After your documents are approved and payment is confirmed, ePlate.my submits the order and schedules fitting after the plate arrives.",
        bullets: ["Submit order details online.", "Upload documents and pay through ToyyibPay.", "Wait for JPJePlate arrival at the workshop.", "Book installation slot and bring the vehicle in."]
      }
    ],
    priority: 0.9
  },
  {
    slug: "eplate-installer-johor-bahru",
    title: "Eplate Installer Johor Bahru | ePlate.my",
    description: "Looking for an eplate installer in Johor Bahru? ePlate.my provides JPJePlate order support and installation at One Auto Motoring, Permas Jaya.",
    eyebrow: "Installer",
    h1: "Eplate installer in Johor Bahru",
    intro: "A local installer page for ZEV/EV drivers searching for JPJePlate fitting and support in JB.",
    sections: [
      {
        eyebrow: "Installer",
        title: "ePlate.my branding, One Auto Motoring workshop",
        body: `ePlate.my is the customer-facing brand for JPJePlate ordering and installation support. ${workshopCopy}`,
        cta: { label: "Order online", href: "/order" }
      },
      {
        eyebrow: "What to ask",
        title: "Before choosing an eplate installer",
        body: "Ask what is included in the package, whether your vehicle is currently eligible, where installation is done, and whether documents, payment, invoice, and appointment records are handled clearly."
      }
    ],
    priority: 0.9
  },
  {
    slug: "jpjeplate-permas-jaya",
    title: "JPJePlate Permas Jaya Workshop | ePlate.my",
    description: "JPJePlate installation at One Auto Motoring in Permas Jaya, Johor Bahru for eligible ZEV/EV drivers.",
    eyebrow: "Workshop area",
    h1: "JPJePlate installation in Permas Jaya",
    intro: "Workshop location details for installation at One Auto Motoring in Permas Jaya.",
    sections: [
      {
        eyebrow: "Location",
        title: site.workshop.label,
        body: `${site.workshop.address}. This location is convenient for Permas Jaya, Tebrau, Johor Bahru, and Pasir Gudang drivers who want installation after completing the order online.`,
        cta: { label: "Open Google Maps", href: site.workshop.mapUrl }
      }
    ],
    priority: 0.85
  },
  {
    slug: "jpjeplate-near-me",
    title: "JPJePlate Near Me in Johor Bahru | ePlate.my",
    description: "Searching JPJePlate near me in Johor Bahru? ePlate.my provides online order support and installation at One Auto Motoring, Permas Jaya.",
    eyebrow: "Near me",
    h1: "JPJePlate near me in Johor Bahru",
    intro: "If you are searching for JPJePlate near you, ePlate.my handles ordering online and installation at our Permas Jaya workshop.",
    sections: [
      {
        eyebrow: "Service areas",
        title: "One workshop, multiple service areas",
        body: "ePlate.my serves eligible ZEV/EV drivers from Johor Bahru, Skudai, Tebrau, Pasir Gudang, Iskandar Puteri, and nearby areas.",
        cta: { label: "Start order", href: "/order" }
      }
    ],
    related: [
      { label: "Johor Bahru", href: "/johor-bahru/" },
      { label: "Skudai", href: "/skudai/" },
      { label: "Tebrau", href: "/tebrau/" },
      { label: "Pasir Gudang", href: "/pasir-gudang/" },
      { label: "Iskandar Puteri", href: "/iskandar-puteri/" }
    ],
    priority: 0.85
  }
];

export function getLandingPage(slug: string) {
  return landingPages.find((page) => page.slug === slug);
}
