'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

export function SiteNavigation() {
  const pathname = usePathname() || '/';
  return <NavigationMenu key={pathname} pathname={pathname} />;
}
function NavigationMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <div
      className="navigation"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <button
        className="menu-toggle"
        ref={toggle}
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
        <span>{open ? 'Close menu' : 'Menu'}</span>
      </button>
      <nav id="main-navigation" aria-label="Main navigation" data-open={open}>
        {[
          ['/projects', 'Discover'],
          ['/tools', 'Toolbox'],
          ['/about', 'About'],
          ['/partners', 'Partner with us'],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href || pathname.startsWith(href + '/') ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
