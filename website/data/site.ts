import { PRICE_MYR, STATUS_LABELS, ORDER_STATUSES } from "@/lib/domain";
export const site = {
  name: "ePlate.my",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://eplate.my",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "60107607333",
  workshop: {
    name: "One Auto Motoring Sdn. Bhd.",
    label: "ePlate.my at One Auto Motoring Sdn. Bhd.",
    address: "34, Jalan Permas 9/7, Permas Jaya, 81750 Johor Bahru, Johor",
    mapUrl: "https://maps.app.goo.gl/BHhva4J4mbhUKzDeA",
    hours: "Mon-Fri 9am-6pm, Sat 9am-1pm, closed Sunday"
  },
  pricing: {
    packagePrice: PRICE_MYR,
    officialPlatePrice: 98,
    currency: "MYR"
  },
  bank: {
    name: process.env.NEXT_PUBLIC_BANK_NAME || "Bank details will be provided after order review",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "ePlate.my",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "Pending setup"
  }
};

export const statusLabels: Record<string, string> = STATUS_LABELS;
export const orderStatuses: readonly string[] = ORDER_STATUSES;
