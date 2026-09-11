import type { Metadata } from 'next';
import { OrderApp } from '@/app/order/OrderApp';
export const metadata: Metadata = { title: 'Installation | ePlate.my', robots: { index: false, follow: false } };
export default function InstallerPage() { return <main className="section"><h1>Installation workspace</h1><OrderApp mode="installer"/></main>; }
