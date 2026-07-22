'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NAV_LINKS } from '@/lib/site-data'
import { useSiteData } from '@/hooks/use-site-data'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const site = useSiteData()
  const t = useTranslations('common')
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const originalStyle = document.body.style.overflow
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 dark:border-white/10 bg-background/70 dark:bg-background/40 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img
            src={site.logo || '/logo.svg'}
            alt={site.nameBn}
            width={200}
            className="h-auto w-28 md:w-32 object-contain"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5"
            >
              {t(link.labelKey as any)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:flex" />
          <DarkModeToggle />
          <Link
            href="/auth/sign-in"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5 sm:inline-flex"
          >
            {t('login')}
          </Link>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={t('openMenu')}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-[50] h-full w-full max-w-sm transform border-l border-border bg-background transition-transform duration-200 ease-in-out lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">
            {t('menu')}
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('closeMenu')}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {t(link.labelKey as any)}
            </Link>
          ))}
          <div className="mt-4 border-t border-border pt-4">
            <LanguageSwitcher className="justify-center" />
            <Link
              href="/auth/sign-in"
              onClick={() => setOpen(false)}
              className="mt-3 block w-full rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('login')}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
