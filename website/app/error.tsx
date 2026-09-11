'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="section narrow"><h1>We couldn’t load this page.</h1><p>Please try again. If the problem continues, contact ePlate.my with your order number.</p><button className="btn" onClick={reset}>Try again</button></main>;
}
