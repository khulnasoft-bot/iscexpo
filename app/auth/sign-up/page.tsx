'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import { useSiteData } from '@/hooks/use-site-data'
import {
  GraduationCap,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react'

type SignUpMode = 'phone' | 'email'
type PhoneStep = 'phone' | 'otp' | 'details'

export default function SignUpPage() {
  const router = useRouter()
  const site = useSiteData()
  const [mode, setMode] = useState<SignUpMode>('phone')
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPhonePassword, setShowPhonePassword] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)

  const [emailName, setEmailName] = useState('')
  const [email, setEmail] = useState('')
  const [emailPhone, setEmailPhone] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: otpError } = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      })

      if (otpError) {
        setError(otpError.message || 'OTP পাঠানো যায়নি')
        return
      }

      setPhoneStep('otp')
    } catch {
      setError('OTP পাঠানো যায়নি')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: verifyError } = await authClient.phoneNumber.verify({
        phoneNumber,
        code: otpCode,
        disableSession: true,
      })

      if (verifyError) {
        setError(verifyError.message || 'OTP যাচাই ব্যর্থ')
        return
      }

      setPhoneStep('details')
    } catch {
      setError('OTP যাচাই ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoneSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: `${phoneNumber}@iscexpo.auth`,
        password,
        name,
        studentId: studentId || undefined,
      } as Parameters<typeof authClient.signUp.email>[0] &
        Record<string, unknown>)

      if (signUpError) {
        setError(signUpError.message || 'নিবন্ধন ব্যর্থ হয়েছে')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('নিবন্ধন ব্যর্থ হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password: emailPassword,
        name: emailName,
        phoneNumber: emailPhone || undefined,
      })

      if (signUpError) {
        setError(signUpError.message || 'নিবন্ধন ব্যর্থ হয়েছে')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('নিবন্ধন ব্যর্থ হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = ['ফোন', 'OTP', 'বিস্তারিত']
  const phoneStepIndex = phoneStep === 'phone' ? 0 : phoneStep === 'otp' ? 1 : 2

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
            {site.nameBn} পরিবারে
            <span className="mt-1 block text-gold">যোগ দিন</span>
          </h2>
          <p className="mt-4 text-brand-foreground/80 leading-relaxed">
            নিবন্ধন করে অনলাইনে কোর্স মডেল টেস্ট, ফলাফল ও ক্লাস স্কেডিউল দেখুন।
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: CheckCircle2, text: 'ফ্রি মডেল টেস্টে অংশ নিন' },
              { icon: Shield, text: 'নিজের ফলাফল ও উপস্থিতি ট্র্যাক করুন' },
              { icon: GraduationCap, text: 'কোর্স ও পেমেন্ট ম্যানেজ করুন' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-xl bg-brand-foreground/10 p-3 backdrop-blur-sm"
              >
                <item.icon className="size-5 text-gold" />
                <span className="text-sm text-brand-foreground/90">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-background px-4 sm:px-8 lg:w-1/2">
        <div
          className="w-full max-w-md space-y-6 animate-fade-in-up"
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
              নিবন্ধন করুন
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {site.nameBn}-এ যোগ দিন
            </p>
          </div>

          <div className="flex rounded-xl border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setMode('phone')
                setError('')
                setPhoneStep('phone')
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                mode === 'phone'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="size-4" />
              ফোন
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('email')
                setError('')
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                mode === 'email'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="size-4" />
              ইমেইল
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive animate-fade-in">
              {error}
            </div>
          )}

          {mode === 'phone' && (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {stepLabels.map((label, index) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        phoneStepIndex === index
                          ? 'bg-brand text-brand-foreground shadow-sm'
                          : phoneStepIndex > index
                            ? 'bg-green/10 text-green'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {phoneStepIndex > index ? '✓' : index + 1}
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                    {index < 2 && (
                      <div
                        className={`h-0.5 flex-1 rounded-full transition-colors ${
                          phoneStepIndex > index ? 'bg-green' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {mode === 'phone' && phoneStep === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-foreground"
                >
                  ফোন নম্বর
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    OTP পাঠান <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'phone' && phoneStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {phoneNumber}
                </span>{' '}
                নম্বরে OTP পাঠানো হয়েছে
              </p>

              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-foreground"
                >
                  OTP কোড
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6 ডিজিটের কোড"
                  maxLength={6}
                  required
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-center text-lg tracking-[0.5em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    যাচাই করুন <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPhoneStep('phone')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ফোন নম্বর পরিবর্তন করুন
              </button>
            </form>
          )}

          {mode === 'phone' && phoneStep === 'details' && (
            <form onSubmit={handlePhoneSignUp} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground"
                >
                  পুরো নাম
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম"
                  required
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="studentId"
                  className="block text-sm font-medium text-foreground"
                >
                  শিক্ষার্থী ID (ঐচ্ছিক)
                </label>
                <input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="যদি থাকে"
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPhonePassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    নিবন্ধন করুন <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label
                  htmlFor="email-name"
                  className="block text-sm font-medium text-foreground"
                >
                  পুরো নাম
                </label>
                <input
                  id="email-name"
                  type="text"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  placeholder="আপনার নাম"
                  required
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  ইমেইল
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="email-phone"
                  className="block text-sm font-medium text-foreground"
                >
                  ফোন নম্বর (ঐচ্ছিক)
                </label>
                <input
                  id="email-phone"
                  type="tel"
                  value={emailPhone}
                  onChange={(e) => setEmailPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="mt-1.5 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="email-password"
                  className="block text-sm font-medium text-foreground"
                >
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    id="email-password"
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    নিবন্ধন করুন <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
            <Link
              href="/auth/sign-in"
              className="font-medium text-brand hover:underline"
            >
              সাইন ইন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
