import type { Metadata } from "next";
import { OrderApp } from "./OrderApp";

export const metadata: Metadata = {
  title: "Order JPJePlate Online | ePlate.my",
  description: "Order eligible ZEV/EV JPJePlate online with ePlate.my. Login by email magic link, upload documents, pay through ToyyibPay, and track installation status.",
  alternates: { canonical: "/order/" },
  robots: { index: true, follow: true }
};

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const requested = (await searchParams).order || '';
  const initialId = /^[a-f0-9-]{36}$/i.test(requested) ? requested : '';
  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow">Customer order</div>
          <h1>Order JPJePlate online.</h1>
          <p className="hero-copy">Login with email magic link, confirm ZEV/EV eligibility, upload required documents, pay securely through ToyyibPay, and track your installation status.</p>
        </div>
      </header>
      <main className="section">
        <OrderApp initialId={initialId} />
      </main>
    </>
  );
}
