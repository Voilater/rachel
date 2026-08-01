import { Link } from "@tanstack/react-router";
import { Globe, Instagram, Mail, Share2 } from "lucide-react";

import {
  footerCare,
  footerDiscover,
  siteConfig,
} from "@/lib/site-data";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-plum text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-serif text-lg leading-relaxed text-white/90">
              {siteConfig.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={siteConfig.instagram.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/70 hover:text-white"
              >
                <Instagram className="size-5" />
              </a>
              <a href="#" aria-label="Share" className="text-white/70 hover:text-white">
                <Share2 className="size-5" />
              </a>
              <a href="#" aria-label="Website" className="text-white/70 hover:text-white">
                <Globe className="size-5" />
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                aria-label="Email"
                className="text-white/70 hover:text-white"
              >
                <Mail className="size-5" />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-footer-label">
              Discover
            </h2>
            <ul className="mt-5 space-y-3">
              {footerDiscover.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="font-serif text-white/85 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-footer-label">
              Care
            </h2>
            <ul className="mt-5 space-y-3">
              {footerCare.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="font-serif text-white/85 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-footer-label">
              Visit Our Studio
            </h2>
            <address className="mt-5 not-italic font-serif leading-relaxed text-white/85">
              {siteConfig.studio.address}
            </address>
            <p className="mt-3 font-serif text-white/85">{siteConfig.studio.hours}</p>
          </div>
        </div>

        <p className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-white/50">
          &copy; {year} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
