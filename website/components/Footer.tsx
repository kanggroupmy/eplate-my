import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <p>
        © 2026 <Link href="/">ePlate.my</Link> · <Link href="/order">Order online</Link> · <Link href="/blog/">Blog</Link> · <Link href="/admin">Admin</Link>
      </p>
      <p>JPJePlate order support and installation in Johor Bahru for eligible ZEV/EV drivers.</p>
    </footer>
  );
}
