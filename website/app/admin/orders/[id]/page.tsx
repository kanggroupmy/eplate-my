import { OrderApp } from "@/app/order/OrderApp";
export default async function Detail({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { id } = await params; return <main className="section"><h1>Order detail</h1><OrderApp mode="admin" initialId={id}/></main>; }
