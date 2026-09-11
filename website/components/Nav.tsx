import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <Link href="/" className="brand" aria-label="ePlate.my home">
        <div className="logo">JP</div>
        <div className="brand-name"><span>JPJe</span>Plate Installer</div>
      </Link>
      <div className="nav-actions">
        <Link className="nav-link optional" href="/jpjeplate-price-malaysia/">Pricing</Link>
        <Link className="nav-link optional" href="/blog/">Guides</Link>
        <Link className="nav-link" href="/order">Order</Link>
      </div>
    </nav>
  );
}
