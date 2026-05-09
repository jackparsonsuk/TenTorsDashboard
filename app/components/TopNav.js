'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="top-nav">
      <div className="nav-container">
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          Dashboard
        </Link>
        <Link href="/leaderboards" className={`nav-link ${pathname === '/leaderboards' ? 'active' : ''}`}>
          Leaderboards
        </Link>
      </div>
    </nav>
  );
}
