'use client'

import { useMobileMenu } from '@/hooks/useMobileMenu'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSiteData } from '@/hooks/use-site-data'

import { DesktopNav } from '@/components/navigation/DesktopNav'
import { MobileNavToggle } from '@/components/navigation/MobileNavToggle'
import { MobileDrawer } from '@/components/navigation/MobileDrawer'

export function SiteHeader() {
  const t = useTranslations('common')
  const site = useSiteData()
  const { open, setOpen } = useMobileMenu()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src={site.logo || '/logo.svg'}
            alt={site.nameBn}
            width={200}
            className="h-auto object-contain"
          />
        </Link>

        <DesktopNav t={t} />

        <div className="flex items-center gap-1">
          <LanguageSwitcher className="hidden sm:flex" />
          <DarkModeToggle />
          <Link
            href="/auth/sign-in"
            className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            {t('login')}
          </Link>
          <MobileNavToggle
            onClick={() => setOpen(!open)}
            aria-label={t('openMenu')}
            isOpen={open}
          />
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      <MobileDrawer />
    </header>
  )
}
