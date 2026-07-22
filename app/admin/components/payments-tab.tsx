'use client'

import { useState, useMemo, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Loader2, Plus, XCircle, Download } from 'lucide-react'
import { PaymentStatusBadge, MethodBadge } from '@/components/ui/status-badge'
import { FilterBar } from '@/components/ui/filter-bar'
import { Alert } from '@/components/ui/alert'
import { DataTablePagination } from '@/components/ui/data-table'
import { exportToCSV } from '@/lib/csv-export'
import {
  getPaymentValidationErrors,
  type PaymentFormValues,
} from '@/lib/payment-utils'
import type { Enrollment, Payment, Student } from './types'

export function PaymentsPanel({
  payments,
  enrollments,
  students,
  onRefresh,
}: {
  payments: Payment[]
  enrollments: Enrollment[]
  students: Student[]
  onRefresh: () => void
}) {
  const t = useTranslations('admin.payments')
  const [filter, setFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [form, setForm] = useState<PaymentFormValues>({
    amount: '',
    method: 'bkash',
    transactionId: '',
    senderNumber: '',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof PaymentFormValues, string>>
  >({})

  const filtered = useMemo(() => {
    let result = filter === 'all' ? payments : payments.filter((p) => p.status === filter)
    if (methodFilter !== 'all') result = result.filter((p) => p.method === methodFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (p) =>
          (p.transactionId || '').toLowerCase().includes(q) ||
          (p.senderNumber || '').toLowerCase().includes(q),
      )
    }
    return result
  }, [payments, filter, methodFilter, searchQuery])

  const paginated = useMemo(() => {
    const start = page * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const payableEnrollments = enrollments.filter(
    (enrollment) => enrollment.dueAmount > 0,
  )
  const selectedEnrollment =
    enrollments.find((enrollment) => enrollment.id === selectedEnrollmentId) ??
    payableEnrollments[0] ??
    null

  async function handleVerify(id: string, status: string) {
    setUpdating(id)
    try {
      await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setFeedback(
        status === 'verified' ? t('verifySuccess') : t('rejectSuccess'),
      )
      onRefresh()
    } catch (error) {
      console.error('Failed to update payment:', error)
      setFeedback(t('verifyFailed'))
    } finally {
      setUpdating(null)
    }
  }

  function openCreateModal() {
    setShowCreateModal(true)
    setFeedback(null)
    setFormErrors({})
    setSelectedEnrollmentId(
      payableEnrollments[0]?.id ?? enrollments[0]?.id ?? '',
    )
    setForm({
      amount: '',
      method: 'bkash',
      transactionId: '',
      senderNumber: '',
      notes: '',
    })
  }

  async function handleCreatePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedEnrollment) return

    const errors = getPaymentValidationErrors(
      {
        amount: form.amount,
        method: form.method,
        transactionId: form.transactionId,
        senderNumber: form.senderNumber,
      },
      selectedEnrollment.dueAmount,
    )

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: selectedEnrollment.id,
          amount: Number(form.amount),
          method: form.method,
          transactionId: form.transactionId.trim() || undefined,
          senderNumber: form.senderNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || t('recordFailed'))
      }

      setShowCreateModal(false)
      setFeedback(t('recordSuccess'))
      onRefresh()
    } catch (error) {
      console.error('Failed to create payment:', error)
      setFeedback(error instanceof Error ? error.message : t('recordFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-bold text-foreground">
          {t('management')}
        </h3>
        <div className="flex items-center gap-2">
          {payments.length > 0 && (
            <button
              onClick={() => exportToCSV(
                filtered,
                [
                  { key: 'paidAt', label: t('tableHeaders.date') },
                  { key: 'amount', label: t('tableHeaders.amount') },
                  { key: 'method', label: t('tableHeaders.method') },
                  { key: 'transactionId', label: t('tableHeaders.transactionId') },
                  { key: 'senderNumber', label: t('tableHeaders.sender') },
                  { key: 'status', label: t('tableHeaders.status') },
                ],
                'payments.csv',
              )}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="size-4" />
              CSV
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            <Plus className="size-4" /> {t('newPayment')}
          </button>
        </div>
      </div>

      <FilterBar
        searchPlaceholder={t('searchPlaceholder')}
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(0) }}
        filters={[
          {
            name: 'status',
            label: t('filterLabel'),
            type: 'select',
            options: [
              { value: 'pending', label: t('statusPending') },
              { value: 'verified', label: t('statusVerified') },
              { value: 'rejected', label: t('statusRejected') },
            ],
            value: filter === 'all' ? '' : filter,
            onChange: (value) => { setFilter(value || 'all'); setPage(0) },
          },
          {
            name: 'method',
            label: t('tableHeaders.method'),
            type: 'select',
            options: [
              { value: 'bkash', label: 'bKash' },
              { value: 'nagad', label: 'Nagad' },
              { value: 'cash', label: 'Cash' },
              { value: 'bank', label: 'Bank' },
            ],
            value: methodFilter === 'all' ? '' : methodFilter,
            onChange: (value) => { setMethodFilter(value || 'all'); setPage(0) },
          },
        ]}
        onClearFilters={() => { setFilter('all'); setMethodFilter('all'); setSearchQuery(''); setPage(0) }}
      />

      {feedback && (
        <Alert
          variant="success"
          message={feedback}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.date')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.student')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.course')}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">
                  {t('tableHeaders.amount')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.method')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.transactionId')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.sender')}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">
                  {t('tableHeaders.status')}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">
                  {t('tableHeaders.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const enrollment = enrollments.find(
                  (item) => item.id === p.enrollmentId,
                )
                const student = students.find(
                  (item) => item.id === enrollment?.userId,
                )

                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {new Date(p.paidAt).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {student?.name || enrollment?.userName || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {enrollment?.courseTitle || '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">
                      ৳{p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <MethodBadge method={p.method} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.transactionId || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.senderNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.status === 'pending' && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleVerify(p.id, 'verified')}
                            disabled={updating === p.id}
                            className="rounded-lg bg-green/10 p-1.5 text-green hover:bg-green/20"
                            title={t('verifyAction')}
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            onClick={() => handleVerify(p.id, 'rejected')}
                            disabled={updating === p.id}
                            className="rounded-lg bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20"
                            title={t('rejectAction')}
                          >
                            <XCircle className="size-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <DataTablePagination
            currentPage={page + 1}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={(p) => setPage(p - 1)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
          />
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-foreground">
                {t('addTitle')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('formLabels.studentEnrollment')}
                </label>
                <select
                  value={selectedEnrollmentId}
                  onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {payableEnrollments.length === 0 && (
                    <option value="">{t('formLabels.noDues')}</option>
                  )}
                  {enrollments.map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {students.find(
                        (student) => student.id === enrollment.userId,
                      )?.name ||
                        enrollment.userName ||
                        t('tableHeaders.student')}{' '}
                      — {enrollment.courseTitle || t('tableHeaders.course')} (
                      {t('formLabels.dueAmount')}: ৳
                      {enrollment.dueAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
                {selectedEnrollment && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('formLabels.dueAmount')}: ৳
                    {selectedEnrollment.dueAmount.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t('formLabels.amount')}
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        amount:
                          e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder={t('formLabels.amountPlaceholder')}
                  />
                  {formErrors.amount && (
                    <p className="mt-1 text-xs text-destructive">
                      {formErrors.amount}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t('formLabels.paymentMethod')}
                  </label>
                  <select
                    value={form.method}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        method: e.target.value as PaymentFormValues['method'],
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="bkash">{t('bkash')}</option>
                    <option value="nagad">{t('nagad')}</option>
                    <option value="cash">{t('cash')}</option>
                    <option value="bank">{t('bank')}</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t('formLabels.transactionId')}
                  </label>
                  <input
                    type="text"
                    value={form.transactionId}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        transactionId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder={t('formLabels.transactionIdPlaceholder')}
                  />
                  {formErrors.transactionId && (
                    <p className="mt-1 text-xs text-destructive">
                      {formErrors.transactionId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {t('formLabels.senderNumber')}
                  </label>
                  <input
                    type="tel"
                    value={form.senderNumber}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        senderNumber: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder={t('formLabels.senderPlaceholder')}
                  />
                  {formErrors.senderNumber && (
                    <p className="mt-1 text-xs text-destructive">
                      {formErrors.senderNumber}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('formLabels.notes')}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder={t('formLabels.notesPlaceholder')}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedEnrollment}
                  className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  ) : (
                    t('recordPayment')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
