'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { authClient } from '@/lib/auth-client'
import { useSiteData } from '@/hooks/use-site-data'
import {
  GraduationCap,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'

type LoginMode = 'phone' | 'email'

export default function SignInPage() {
  const router = useRouter()
  const site = useSiteData()
  const t = useTranslations('auth.signIn')
  const tc = useTranslations('common')
  const [mode, setMode] = useState<LoginMode>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phonePassword, setPhonePassword] = useState('')
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [showPhonePassword, setShowPhonePassword] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await authClient.signIn.phoneNumber({
        phoneNumber,
        password: phonePassword,
        rememberMe: true,
      })

      if (authError) {
        setError(authError.message || t('error'))
        return
      }

      const phoneUserRole = (data?.user as Record<string, unknown>)?.role
      if (phoneUserRole === 'super-admin' || phoneUserRole === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password: emailPassword,
        rememberMe: true,
      })

      if (authError) {
        setError(authError.message || t('error'))
        return
      }

      const emailUserRole = (data?.user as Record<string, unknown>)?.role
      if (emailUserRole === 'super-admin' || emailUserRole === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const resolvedMode = hydrated ? mode : 'phone'

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 items-center justify-center bg-brand lg:flex">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/images/classroom.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand/90 to-brand/70" />
        <div className="relative z-10 max-w-md px-8 text-brand-foreground animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logo.svg"
              alt={site.nameEn}
              width={48}
              height={30}
              className="object-contain"
            />
            <span className="font-heading text-2xl font-bold">
              {site.nameBn}
            </span>
          </div>
          <h2 className="font-heading text-3xl font-extrabold leading-tight">
            {t('tagline')}
            <span className="mt-1 block text-gold">
              {t('taglineHighlight')}
            </span>
          </h2>
          <p className="mt-4 text-brand-foreground/80 leading-relaxed">
            {t('taglineDescription')}
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-2xl bg-brand-foreground/10 p-4 backdrop-blur-sm">
              <p className="font-heading text-2xl font-bold text-gold">৯৫%</p>
              <p className="mt-1 text-xs text-brand-foreground/70">
                {tc('success')}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-foreground/10 p-4 backdrop-blur-sm">
              <p className="font-heading text-2xl font-bold text-gold">৫০০০+</p>
              <p className="mt-1 text-xs text-brand-foreground/70">
                {tc('teachers')}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-foreground/10 p-4 backdrop-blur-sm">
              <p className="font-heading text-2xl font-bold text-gold">১০+</p>
              <p className="mt-1 text-xs text-brand-foreground/70">Years</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-background px-4 sm:px-8 lg:w-1/2">
        <div
          className="w-full max-w-md space-y-8 animate-fade-in-up"
          style={{ animationDuration: '600ms' }}
        >
          <div>
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 lg:hidden"
            >
              <Image
                src="/logo.svg"
                alt={site.nameEn}
                width={36}
                height={22}
                className="object-contain"
              />
              <span className="font-heading text-lg font-bold text-foreground">
                {site.nameBn}
              </span>
            </Link>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex rounded-xl border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setMode('phone')
                setError('')
              }}
              suppressHydrationWarning
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                resolvedMode === 'phone'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="size-4" />
              {t('phoneTab')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('email')
                setError('')
              }}
              suppressHydrationWarning
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                resolvedMode === 'email'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="size-4" />
              {t('emailTab')}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive animate-fade-in">
              {error}
            </div>
          )}

          {resolvedMode === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-foreground"
                >
                  {t('phoneLabel')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  suppressHydrationWarning
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="phone-password"
                  className="block text-sm font-medium text-foreground"
                >
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="phone-password"
                    type={showPhonePassword ? 'text' : 'password'}
                    suppressHydrationWarning
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhonePassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPhonePassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {t('submit')} <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {resolvedMode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  {t('emailLabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  suppressHydrationWarning
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="email-password"
                  className="block text-sm font-medium text-foreground"
                >
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="email-password"
                    type={showEmailPassword ? 'text' : 'password'}
                    suppressHydrationWarning
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showEmailPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {t('submit')} <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-brand hover:underline"
            >
              {t('signUpLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
