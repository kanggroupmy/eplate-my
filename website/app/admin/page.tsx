import type { Metadata } from "next";
import { OrderApp } from "@/app/order/OrderApp";
export const metadata: Metadata = { title: "Operations | ePlate.my", robots: { index: false, follow: false } };
export default function AdminPage() { return <main className="section"><h1>Order operations</h1><OrderApp mode="admin"/></main>; }
