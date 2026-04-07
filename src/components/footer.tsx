import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/gifts", label: "Our Gifts" },
    { href: "/letters", label: "Legacy Letters" },
    { href: "/pricing", label: "Pricing" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/executor-access", label: "Executor Access" },
  ],
} as const;

export function Footer() {
  return (
    <footer className="bg-cream-dark text-navy">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo and Tagline */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-1.5 group">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gold transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-lg font-bold text-navy tracking-tight">
                SendForGood
              </span>
            </Link>
            <p className="mt-3 text-sm text-warm-gray leading-relaxed max-w-xs">
              Legacy giving, made simple.
            </p>
            <a
              href="sms:+16317074968"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-navy transition-colors duration-150"
            >
              <span aria-hidden="true">📱</span> Text: (631) 707-4968
            </a>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-navy uppercase tracking-wider">
                {category}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-warm-gray hover:text-navy transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-navy/10">
          <p className="text-sm text-warm-gray text-center">
            &copy; 2026 SendForGood. All rights reserved. Made with love.
          </p>
        </div>
      </div>
    </footer>
  );
}
