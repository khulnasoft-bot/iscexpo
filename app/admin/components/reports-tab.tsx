'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Download,
  Loader2,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type {
  Enrollment,
  Payment,
  Course,
  Student,
  AttendanceRecord,
  ExamSubmission,
  Exam,
  EnrollmentTrend,
  RevenueReport,
  AttendanceStats,
  CourseAnalytics,
  FeeCollectionReport,
  StudentPerformance,
} from './types'

type ReportType =
  | 'enrollment-trends'
  | 'revenue'
  | 'attendance'
  | 'course-analytics'
  | 'fee-collection'
  | 'student-performance'

export function ReportsPanel({
  enrollments,
  payments,
  courses,
  students,
  attendance,
  examSubmissions,
  exams,
}: {
  enrollments: Enrollment[]
  payments: Payment[]
  courses: Course[]
  students: Student[]
  attendance: AttendanceRecord[]
  examSubmissions: ExamSubmission[]
  exams: Exam[]
}) {
  const t = useTranslations('admin.reports')

  const REPORT_TYPES = [
    {
      id: 'enrollment-trends' as const,
      label: t('types.enrollmentTrends'),
      icon: Users,
    },
    { id: 'revenue' as const, label: t('types.revenue'), icon: DollarSign },
    { id: 'attendance' as const, label: t('types.attendance'), icon: Calendar },
    {
      id: 'course-analytics' as const,
      label: t('types.courseAnalytics'),
      icon: BarChart3,
    },
    {
      id: 'fee-collection' as const,
      label: t('types.feeCollection'),
      icon: FileText,
    },
    {
      id: 'student-performance' as const,
      label: t('types.studentPerformance'),
      icon: TrendingUp,
    },
  ]

  const MONTHS_BN = [
    t('months.jan'),
    t('months.feb'),
    t('months.mar'),
    t('months.apr'),
    t('months.may'),
    t('months.jun'),
    t('months.jul'),
    t('months.aug'),
    t('months.sep'),
    t('months.oct'),
    t('months.nov'),
    t('months.dec'),
  ]

  function formatMonth(dateStr: string) {
    const d = new Date(dateStr)
    return `${MONTHS_BN[d.getMonth()]} ${d.getFullYear()}`
  }

  function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('bn-BD')}`
  }

  function calculatePercentage(value: number, total: number) {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const [activeReport, setActiveReport] =
    useState<ReportType>('enrollment-trends')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (dateRange.start && new Date(e.enrolledAt) < new Date(dateRange.start))
        return false
      if (dateRange.end && new Date(e.enrolledAt) > new Date(dateRange.end))
        return false
      return true
    })
  }, [enrollments, dateRange])

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (dateRange.start && new Date(p.paidAt) < new Date(dateRange.start))
        return false
      if (dateRange.end && new Date(p.paidAt) > new Date(dateRange.end))
        return false
      return true
    })
  }, [payments, dateRange])

  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      if (dateRange.start && new Date(a.date) < new Date(dateRange.start))
        return false
      if (dateRange.end && new Date(a.date) > new Date(dateRange.end))
        return false
      return true
    })
  }, [attendance, dateRange])

  const enrollmentTrends: EnrollmentTrend[] = useMemo(() => {
    const monthly: Record<string, number> = {}
    filteredEnrollments.forEach((e) => {
      const month = formatMonth(e.enrolledAt)
      monthly[month] = (monthly[month] || 0) + 1
    })
    return Object.entries(monthly)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([period, count]) => ({ period, count }))
  }, [filteredEnrollments])

  const revenueReport: RevenueReport[] = useMemo(() => {
    const monthly: Record<string, { verified: number; pending: number }> = {}
    filteredPayments.forEach((p) => {
      const month = formatMonth(p.paidAt)
      if (!monthly[month]) monthly[month] = { verified: 0, pending: 0 }
      if (p.status === 'verified') monthly[month].verified += p.amount
      else monthly[month].pending += p.amount
    })
    return Object.entries(monthly)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([period, data]) => ({
        period,
        verified: data.verified,
        pending: data.pending,
        total: data.verified + data.pending,
      }))
  }, [filteredPayments])

  const attendanceStats: AttendanceStats[] = useMemo(() => {
    const studentMap: Record<string, AttendanceStats> = {}
    const activeStudents = students.filter((s) => s.role === 'student')

    activeStudents.forEach((s) => {
      studentMap[s.id] = {
        studentId: s.id,
        studentName: s.name,
        present: 0,
        late: 0,
        absent: 0,
        total: 0,
        percentage: 0,
      }
    })

    filteredAttendance.forEach((a) => {
      if (studentMap[a.userId]) {
        studentMap[a.userId][a.status]++
        studentMap[a.userId].total++
      }
    })

    Object.values(studentMap).forEach((stat) => {
      stat.percentage = calculatePercentage(
        stat.present + stat.late,
        stat.total,
      )
    })

    return Object.values(studentMap).filter((s) => s.total > 0)
  }, [students, filteredAttendance])

  const courseAnalytics: CourseAnalytics[] = useMemo(() => {
    return courses.map((course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.courseId === course.id,
      )
      const activeEnrollments = courseEnrollments.filter(
        (e) => e.status === 'active' || e.status === 'approved',
      )
      const completedEnrollments = courseEnrollments.filter(
        (e) => e.status === 'completed',
      )

      const coursePayments = payments.filter((p) =>
        courseEnrollments.some((e) => e.id === p.enrollmentId),
      )
      const totalRevenue = coursePayments
        .filter((p) => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0)

      const courseAttendance = attendance.filter((a) =>
        activeEnrollments.some((e) => e.userId === a.userId),
      )
      const totalAttendance = courseAttendance.length
      const presentAttendance = courseAttendance.filter(
        (a) => a.status === 'present' || a.status === 'late',
      ).length
      const averageAttendance =
        totalAttendance > 0
          ? calculatePercentage(presentAttendance, totalAttendance)
          : 0

      return {
        courseId: course.id,
        courseTitle: course.title,
        totalEnrollments: courseEnrollments.length,
        activeStudents: activeEnrollments.length,
        completedStudents: completedEnrollments.length,
        totalRevenue,
        averageAttendance,
      }
    })
  }, [courses, enrollments, payments, attendance])

  const feeCollectionReport: FeeCollectionReport[] = useMemo(() => {
    return enrollments
      .filter(
        (e) =>
          e.status === 'active' ||
          e.status === 'approved' ||
          e.status === 'pending',
      )
      .map((e) => {
        const enrollmentPayments = payments.filter(
          (p) => p.enrollmentId === e.id && p.status === 'verified',
        )
        const paidAmount = enrollmentPayments.reduce(
          (sum, p) => sum + p.amount,
          0,
        )
        const lastPayment = enrollmentPayments.sort(
          (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
        )[0]

        return {
          studentId: e.userId,
          studentName: e.userName || '—',
          studentPhone: e.userPhone || '—',
          courseTitle: e.courseTitle || '—',
          totalFee: e.totalFee,
          paidAmount,
          dueAmount: e.dueAmount,
          status:
            e.dueAmount <= 0
              ? 'paid'
              : e.dueAmount < e.totalFee
                ? 'partial'
                : 'unpaid',
          lastPaymentDate: lastPayment?.paidAt || null,
        }
      })
  }, [enrollments, payments])

  const studentPerformance: StudentPerformance[] = useMemo(() => {
    const perfMap: Record<string, StudentPerformance> = {}

    examSubmissions.forEach((s) => {
      if (!perfMap[s.userId]) {
        perfMap[s.userId] = {
          studentId: s.userId,
          studentName: s.userName || s.userStudentId || '—',
          examsAttempted: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 100,
        }
      }
      const p = perfMap[s.userId]
      const pct = (s.score / s.total) * 100
      p.examsAttempted++
      p.averageScore =
        (p.averageScore * (p.examsAttempted - 1) + pct) / p.examsAttempted
      p.highestScore = Math.max(p.highestScore, pct)
      p.lowestScore = Math.min(p.lowestScore, pct)
    })

    return Object.values(perfMap).map((p) => ({
      ...p,
      averageScore: Math.round(p.averageScore),
      highestScore: Math.round(p.highestScore),
      lowestScore: p.lowestScore === 100 ? 0 : Math.round(p.lowestScore),
    }))
  }, [examSubmissions])

  async function handleExport() {
    setExporting(true)
    try {
      let csv: string[] = []
      let filename = ''

      switch (activeReport) {
        case 'enrollment-trends':
          csv = [`${t('csvHeaders.enrollmentTrends')}\n`]
          enrollmentTrends.forEach((e) => csv.push(`${e.period},${e.count}`))
          filename = 'enrollment-trends.csv'
          break
        case 'revenue':
          csv = [`${t('csvHeaders.revenue')}\n`]
          revenueReport.forEach((r) =>
            csv.push(`${r.period},${r.verified},${r.pending},${r.total}`),
          )
          filename = 'revenue-report.csv'
          break
        case 'attendance':
          csv = [`${t('csvHeaders.attendance')}\n`]
          attendanceStats.forEach((s) =>
            csv.push(
              `${s.studentName},${s.present},${s.late},${s.absent},${s.total},${s.percentage}%`,
            ),
          )
          filename = 'attendance-report.csv'
          break
        case 'course-analytics':
          csv = [`${t('csvHeaders.courseAnalytics')}\n`]
          courseAnalytics.forEach((c) =>
            csv.push(
              `${c.courseTitle},${c.totalEnrollments},${c.activeStudents},${c.completedStudents},${c.totalRevenue},${c.averageAttendance}%`,
            ),
          )
          filename = 'course-analytics.csv'
          break
        case 'fee-collection':
          csv = [`${t('csvHeaders.feeCollection')}\n`]
          feeCollectionReport.forEach((f) =>
            csv.push(
              `${f.studentName},${f.studentPhone},${f.courseTitle},${f.totalFee},${f.paidAmount},${f.dueAmount},${f.status},${f.lastPaymentDate || '—'}`,
            ),
          )
          filename = 'fee-collection-report.csv'
          break
        case 'student-performance':
          csv = [`${t('csvHeaders.studentPerformance')}\n`]
          studentPerformance.forEach((s) =>
            csv.push(
              `${s.studentName},${s.examsAttempted},${s.averageScore}%,${s.highestScore}%,${s.lowestScore}%`,
            ),
          )
          filename = 'student-performance.csv'
          break
      }

      const blob = new Blob([csv.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const renderReportContent = () => {
    switch (activeReport) {
      case 'enrollment-trends':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t('stats.totalEnrollments')}
                value={filteredEnrollments.length}
                icon={Users}
                color="brand"
              />
              <StatCard
                label={t('stats.thisMonth')}
                value={
                  filteredEnrollments.filter(
                    (e) =>
                      new Date(e.enrolledAt).getMonth() ===
                      new Date().getMonth(),
                  ).length
                }
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                label={t('stats.pending')}
                value={
                  filteredEnrollments.filter((e) => e.status === 'pending')
                    .length
                }
                icon={Calendar}
                color="gold"
              />
            </div>
            <ChartCard title={t('charts.monthlyEnrollmentTrend')}>
              <SimpleBarChart data={enrollmentTrends} xKey="period" yKey="count" />
            </ChartCard>
            <DataTable
              headers={[
                t('dataTableHeaders.month'),
                t('dataTableHeaders.enrollmentCount'),
              ]}
              rows={enrollmentTrends.map((en) => [
                en.period,
                en.count.toString(),
              ])}
            />
          </div>
        )

      case 'revenue':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t('stats.totalRevenue')}
                value={formatCurrency(
                  revenueReport.reduce((s, r) => s + r.verified, 0),
                )}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                label={t('stats.pending')}
                value={formatCurrency(
                  revenueReport.reduce((s, r) => s + r.pending, 0),
                )}
                icon={Clock}
                color="gold"
              />
              <StatCard
                label={t('stats.totalPayments')}
                value={filteredPayments.length}
                icon={FileText}
                color="brand"
              />
            </div>
            <ChartCard title={t('charts.monthlyRevenue')}>
              <RevenueChart data={revenueReport} />
            </ChartCard>
            <DataTable
              headers={[
                t('dataTableHeaders.month'),
                t('dataTableHeaders.verified'),
                t('dataTableHeaders.pending'),
                t('dataTableHeaders.total'),
              ]}
              rows={revenueReport.map((r) => [
                r.period,
                formatCurrency(r.verified),
                formatCurrency(r.pending),
                formatCurrency(r.total),
              ])}
            />
          </div>
        )

      case 'attendance':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t('stats.averageAttendance')}
                value={
                  attendanceStats.length > 0
                    ? `${Math.round(
                        attendanceStats.reduce((s, a) => s + a.percentage, 0) /
                          attendanceStats.length,
                      )}%`
                    : '0%'
                }
                icon={Calendar}
                color="green"
              />
              <StatCard
                label={t('stats.totalRecords')}
                value={filteredAttendance.length}
                icon={FileText}
                color="brand"
              />
              <StatCard
                label={t('stats.studentCount')}
                value={attendanceStats.length}
                icon={Users}
                color="blue"
              />
            </div>
            <ChartCard title={t('charts.attendanceOverview')}>
              <AttendanceChart data={attendanceStats} />
            </ChartCard>
            <DataTable
              headers={[
                t('dataTableHeaders.student'),
                t('dataTableHeaders.present'),
                t('dataTableHeaders.late'),
                t('dataTableHeaders.absent'),
                t('dataTableHeaders.total'),
                t('dataTableHeaders.percentage'),
              ]}
              rows={attendanceStats.map((s) => [
                s.studentName,
                s.present.toString(),
                s.late.toString(),
                s.absent.toString(),
                s.total.toString(),
                `${s.percentage}%`,
              ])}
            />
          </div>
        )

      case 'course-analytics':
        return (
          <div className="space-y-4">
            <ChartCard title={t('charts.courseAnalytics')}>
              <CourseAnalyticsChart data={courseAnalytics} />
            </ChartCard>
            <DataTable
              headers={[
                t('dataTableHeaders.course'),
                t('dataTableHeaders.total'),
                t('dataTableHeaders.active'),
                t('dataTableHeaders.completed'),
                t('dataTableHeaders.revenue'),
                t('dataTableHeaders.averageAttendance'),
              ]}
              rows={courseAnalytics.map((c) => [
                c.courseTitle,
                c.totalEnrollments.toString(),
                c.activeStudents.toString(),
                c.completedStudents.toString(),
                formatCurrency(c.totalRevenue),
                `${c.averageAttendance}%`,
              ])}
            />
          </div>
        )

      case 'fee-collection':
        const totalDue = feeCollectionReport.reduce(
          (s, f) => s + f.dueAmount,
          0,
        )
        const totalCollected = feeCollectionReport.reduce(
          (s, f) => s + f.paidAmount,
          0,
        )
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t('stats.totalDue')}
                value={formatCurrency(totalDue)}
                icon={DollarSign}
                color="red"
              />
              <StatCard
                label={t('stats.totalCollected')}
                value={formatCurrency(totalCollected)}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                label={t('stats.fullyPaid')}
                value={
                  feeCollectionReport.filter((f) => f.status === 'paid').length
                }
                icon={CheckCircle}
                color="blue"
              />
            </div>
            <DataTable
              headers={[
                t('dataTableHeaders.student'),
                t('dataTableHeaders.phone'),
                t('dataTableHeaders.course'),
                t('dataTableHeaders.totalFee'),
                t('dataTableHeaders.payment'),
                t('dataTableHeaders.due'),
                t('dataTableHeaders.status'),
                t('dataTableHeaders.lastPayment'),
              ]}
              rows={feeCollectionReport.map((f) => [
                f.studentName,
                f.studentPhone,
                f.courseTitle,
                formatCurrency(f.totalFee),
                formatCurrency(f.paidAmount),
                formatCurrency(f.dueAmount),
                f.status === 'paid'
                  ? t('feeStatus.paid')
                  : f.status === 'partial'
                    ? t('feeStatus.partial')
                    : t('feeStatus.unpaid'),
                f.lastPaymentDate ? formatMonth(f.lastPaymentDate) : '—',
              ])}
            />
          </div>
        )

      case 'student-performance':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label={t('stats.totalStudents')}
                value={studentPerformance.length}
                icon={Users}
                color="brand"
              />
              <StatCard
                label={t('stats.averageScore')}
                value={
                  studentPerformance.length > 0
                    ? `${Math.round(
                        studentPerformance.reduce(
                          (s, p) => s + p.averageScore,
                          0,
                        ) / studentPerformance.length,
                      )}%`
                    : '0%'
                }
                icon={BarChart3}
                color="green"
              />
              <StatCard
                label={t('stats.examsTaken')}
                value={studentPerformance.reduce(
                  (s, p) => s + p.examsAttempted,
                  0,
                )}
                icon={FileText}
                color="blue"
              />
            </div>
            <ChartCard title={t('charts.studentPerformance')}>
              <PerformanceChart data={studentPerformance} />
            </ChartCard>
            <DataTable
              headers={[
                t('dataTableHeaders.student'),
                t('dataTableHeaders.examsTaken'),
                t('dataTableHeaders.averageScore'),
                t('dataTableHeaders.highest'),
                t('dataTableHeaders.lowest'),
              ]}
              rows={studentPerformance.map((s) => [
                s.studentName,
                s.examsAttempted.toString(),
                `${s.averageScore}%`,
                `${s.highestScore}%`,
                `${s.lowestScore}%`,
              ])}
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveReport(type.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeReport === type.id
                  ? 'bg-brand text-brand-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <type.icon className="size-4" />
              {type.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onStartDateChange={(d) => setDateRange((p) => ({ ...p, start: d }))}
            onEndDateChange={(d) => setDateRange((p) => ({ ...p, end: d }))}
            showPresets
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {t('exportCsv')}
          </button>
        </div>
      </div>

      {renderReportContent()}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand/10 text-brand',
    green: 'bg-green/10 text-green',
    gold: 'bg-gold/15 text-gold',
    red: 'bg-destructive/10 text-destructive',
    blue: 'bg-blue-500/10 text-blue-500',
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex size-11 items-center justify-center rounded-xl ${colorMap[color]}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h4 className="font-heading font-semibold text-foreground mb-4">
        {title}
      </h4>
      {children}
    </div>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const t = useTranslations('admin.reports')
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold text-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {t('noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SimpleBarChart({
  data,
  xKey,
  yKey,
}: {
  data: any[]
  xKey: string
  yKey: string
}) {
  const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#8b5cf6']
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function RevenueChart({ data }: { data: RevenueReport[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="verified" fill="#16a34a" radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="pending" fill="#eab308" radius={[4, 4, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function AttendanceChart({ data }: { data: AttendanceStats[] }) {
  const t = useTranslations('admin.reports')
  if (data.length === 0)
    return (
      <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
    )
  const present = data.reduce((s, d) => s + d.present + d.late, 0)
  const absent = data.reduce((s, d) => s + d.absent, 0)
  const pieData = [
    { name: t('attendancePresent'), value: present, color: '#16a34a' },
    { name: t('attendanceAbsent'), value: absent, color: '#dc2626' },
  ]
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function CourseAnalyticsChart({ data }: { data: CourseAnalytics[] }) {
  const t = useTranslations('admin.reports')
  if (data.length === 0)
    return (
      <p className="text-center text-muted-foreground py-8">{t('noCourses')}</p>
    )
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="courseTitle" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="totalEnrollments" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function PerformanceChart({ data }: { data: StudentPerformance[] }) {
  const t = useTranslations('admin.reports')
  if (data.length === 0)
    return (
      <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
    )
  const sorted = [...data]
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="studentName" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="averageScore" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
