'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useSiteData } from '@/hooks/use-site-data'

export function SiteFooter() {
  const site = useSiteData()
  const t = useTranslations('common')

  return (
    <footer className="relative border-t border-white/20 dark:border-white/10 bg-gradient-to-b from-background via-background to-blue-50/30 dark:to-blue-950/20 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <img
                src={site.logo || '/logo.svg'}
                alt={site.nameBn}
                width={140}
                className="h-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {site.addressBn}
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 transition-colors">
                f
              </a>
              <a href="#" className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 transition-colors">
                𝕏
              </a>
              <a href="#" className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 transition-colors">
                in
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-3">
              <Link
                href="/courses"
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t('courses')}
              </Link>
              <Link
                href="/notice"
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t('notice')}
              </Link>
              <Link
                href="/gallery"
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t('gallery')}
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <nav className="flex flex-col gap-3">
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t('contact')}
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t('privacyPolicy')}
              </Link>
              <a
                href="mailto:contact@example.com"
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Support
              </a>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Stay updated with our latest courses
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-lg border border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
              <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/20 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {site.nameBn}. {t('allRightsReserved')}.
          </p>
          <p className="text-xs text-muted-foreground">
            Designed with ❤️ by ISC Team
          </p>
        </div>
      </div>
    </footer>
  )
}
