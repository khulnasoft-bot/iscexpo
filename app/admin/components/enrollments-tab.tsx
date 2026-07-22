'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Pencil,
  X,
  Loader2,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EnrollmentStatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmptyState } from '@/components/ui/empty-state'
import type { Enrollment, Course, Student } from './types'
import { useToast } from '@/components/ui/toast'
import { exportToCSV } from '@/lib/csv-export'

const inputCls =
  'mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
const labelCls = 'block text-sm font-medium text-foreground'

type AddFormState = {
  userId: string
  selectedCourseIds: string[]
  notes: string
  discount: string
}

type EditState = {
  status: string
  notes: string
  startDate: string
  endDate: string
  discount: string
}

export function EnrollmentsPanel({
  enrollments,
  courses,
  students,
  onRefresh,
}: {
  enrollments: Enrollment[]
  courses: Course[]
  students: Student[]
  onRefresh: () => void
}) {
  const t = useTranslations('admin.enrollments')

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: 'pending', label: t('statusOptions.pending') },
      { value: 'approved', label: t('statusOptions.approved') },
      { value: 'active', label: t('statusOptions.active') },
      { value: 'completed', label: t('statusOptions.completed') },
      { value: 'rejected', label: t('statusOptions.rejected') },
      { value: 'cancelled', label: t('statusOptions.cancelled') },
    ],
    [t],
  )

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [sortKey, setSortKey] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<AddFormState>({
    userId: '',
    selectedCourseIds: [],
    notes: '',
    discount: '0',
  })
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [courseSearch, setCourseSearch] = useState('')

  const [editing, setEditing] = useState<Enrollment | null>(null)
  const [editForm, setEditForm] = useState<EditState>({
    status: '',
    notes: '',
    startDate: '',
    endDate: '',
    discount: '0',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const { success, error, confirm } = useToast()
  const [cancelling, setCancelling] = useState<string | null>(null)

  // Bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'status' | 'cancel' | null>(null)
  const [bulkStatus, setBulkStatus] = useState('active')
  const [bulkSaving, setBulkSaving] = useState(false)

  const resetPage = useCallback(() => setPage(1), [])

  const activeCourses = courses.filter((c) => c.isActive)
  const filtered = useMemo(() => {
    let result = enrollments.filter((e) => {
      if (filter && filter !== 'all' && e.status !== filter) return false
      if (courseFilter !== 'all' && e.courseId !== courseFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (e.userName || '').toLowerCase().includes(q) ||
          (e.userPhone || '').toLowerCase().includes(q) ||
          (e.courseTitle || '').toLowerCase().includes(q)
        )
      }
      return true
    })
    if (sortKey) {
      result.sort((a, b) => {
        let cmp = 0
        if (sortKey === 'userName') cmp = (a.userName || '').localeCompare(b.userName || '')
        else if (sortKey === 'courseTitle') cmp = (a.courseTitle || '').localeCompare(b.courseTitle || '')
        else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
        else if (sortKey === 'totalFee') cmp = a.totalFee - b.totalFee
        else if (sortKey === 'dueAmount') cmp = a.dueAmount - b.dueAmount
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [enrollments, filter, courseFilter, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  )

  const filteredActiveCourses = useMemo(() => {
    if (!courseSearch) return activeCourses
    const q = courseSearch.toLowerCase()
    return activeCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.courseCode || '').toLowerCase().includes(q),
    )
  }, [activeCourses, courseSearch])

  const addDiscountNum = Math.max(0, parseInt(addForm.discount) || 0)
  const addMaxDiscount = useMemo(() => {
    if (addForm.selectedCourseIds.length === 0) return 0
    return addForm.selectedCourseIds.reduce((max, cid) => {
      const c = activeCourses.find((x) => x.id === cid)
      const fee = c ? c.discountFee || c.fee : 0
      return Math.max(max, fee)
    }, 0)
  }, [addForm.selectedCourseIds, activeCourses])
  const addTotalFee = useMemo(() => {
    return addForm.selectedCourseIds.reduce((sum, cid) => {
      const c = activeCourses.find((x) => x.id === cid)
      if (!c) return sum
      const fee = c.discountFee || c.fee
      return sum + Math.max(0, fee - addDiscountNum)
    }, 0)
  }, [addForm.selectedCourseIds, addDiscountNum, activeCourses])

  const addCourseFees = useMemo(() => {
    return addForm.selectedCourseIds.map((cid) => {
      const c = activeCourses.find((x) => x.id === cid)
      return {
        id: cid,
        title: c?.title || cid,
        fee: c ? c.discountFee || c.fee : 0,
      }
    })
  }, [addForm.selectedCourseIds, activeCourses])

  const editCourseFee = useMemo(() => {
    if (!editing) return 0
    const c = courses.find((c) => c.id === editing.courseId)
    return c ? c.discountFee || c.fee : editing.totalFee + editing.discount
  }, [editing, courses])

  const editDiscountNum = Math.max(0, parseInt(editForm.discount) || 0)
  const editTotalFee = Math.max(0, editCourseFee - editDiscountNum)

  function toggleCourse(courseId: string) {
    setAddForm((prev) => {
      const exists = prev.selectedCourseIds.includes(courseId)
      return {
        ...prev,
        selectedCourseIds: exists
          ? prev.selectedCourseIds.filter((id) => id !== courseId)
          : [...prev.selectedCourseIds, courseId],
      }
    })
  }

  function toggleAllCourses() {
    setAddForm((prev) => ({
      ...prev,
      selectedCourseIds:
        prev.selectedCourseIds.length === filteredActiveCourses.length
          ? []
          : filteredActiveCourses.map((c) => c.id),
    }))
  }

  // Bulk selection handlers
  function toggleSelectAll() {
    if (selectedIds.length === paged.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paged.map((e) => e.id))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function handleBulkAction() {
    if (selectedIds.length === 0) return
    setBulkSaving(true)
    let successCount = 0
    let failCount = 0
    try {
      if (bulkAction === 'status') {
        for (const id of selectedIds) {
          const res = await fetch(`/api/enrollments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkStatus }),
          })
          if (res.ok) successCount++
          else failCount++
        }
        if (failCount > 0) {
          error(
            t('bulkPartialSuccess', { success: successCount, fail: failCount }),
          )
        } else {
          success(t('bulkSuccess', { count: successCount }))
        }
      } else if (bulkAction === 'cancel') {
        for (const id of selectedIds) {
          const res = await fetch(`/api/enrollments/${id}`, {
            method: 'DELETE',
          })
          if (res.ok) successCount++
          else failCount++
        }
        if (failCount > 0) {
          error(
            t('bulkPartialDelete', { success: successCount, fail: failCount }),
          )
        } else {
          success(t('bulkDeleteSuccess', { count: successCount }))
        }
      }
      setSelectedIds([])
      setBulkAction(null)
      onRefresh()
    } catch {
      error(t('bulkFailed'))
    } finally {
      setBulkSaving(false)
    }
  }

  async function handleAdd() {
    if (!addForm.userId || addForm.selectedCourseIds.length === 0) return
    setAddSaving(true)
    setAddError('')
    try {
      const body: Record<string, unknown> = {
        courseIds: addForm.selectedCourseIds,
        userId: addForm.userId,
      }
      if (addForm.notes.trim()) body.notes = addForm.notes.trim()
      if (addDiscountNum > 0) body.discount = addDiscountNum
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        const count = data.count || 0
        const errCount = data.errors?.length || 0
        if (errCount > 0 && count > 0) {
          setAddError(
            t('partialCreateSuccess', { success: count, fail: errCount }),
          )
        } else if (errCount > 0) {
          setAddError(
            data.details
              ?.map((d: { courseId: string; error: string }) => d.error)
              .join(', ') || t('createFailed'),
          )
          return
        }
        setShowAdd(false)
        setAddForm({
          userId: '',
          selectedCourseIds: [],
          notes: '',
          discount: '0',
        })
        setCourseSearch('')
        onRefresh()
      } else {
        const details = data.details
          ? Object.entries(data.details)
              .map(
                ([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`,
              )
              .join('; ')
          : ''
        setAddError(
          details
            ? `${data.error} (${details})`
            : data.error || t('createFailed'),
        )
      }
    } catch {
      setAddError(t('createFailed'))
    } finally {
      setAddSaving(false)
    }
  }

  function handleEditClick(e: Enrollment) {
    setEditing(e)
    setEditForm({
      status: e.status,
      notes: e.notes || '',
      startDate: e.startDate ? e.startDate.slice(0, 10) : '',
      endDate: e.endDate ? e.endDate.slice(0, 10) : '',
      discount: String(e.discount || 0),
    })
    setEditError('')
  }

  async function handleEditSave() {
    if (!editing) return
    setEditSaving(true)
    setEditError('')
    try {
      const body: Record<string, unknown> = {
        status: editForm.status,
        notes: editForm.notes.trim() || undefined,
        discount: editDiscountNum,
        totalFee: editTotalFee,
      }
      if (editForm.startDate) body.startDate = editForm.startDate
      if (editForm.endDate) body.endDate = editForm.endDate
      const res = await fetch(`/api/enrollments/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setEditing(null)
        onRefresh()
      } else {
        const err = await res.json().catch(() => ({ error: t('updateFailed') }))
        setEditError(err.error || t('updateFailed'))
      }
    } catch {
      setEditError(t('updateFailed'))
    } finally {
      setEditSaving(false)
    }
  }

  async function handleCancel(id: string) {
    if (!(await confirm(t('cancelConfirm')))) return
    setCancelling(id)
    try {
      const res = await fetch(`/api/enrollments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onRefresh()
        success(t('cancelSuccess'))
      } else {
        const err = await res.json().catch(() => ({}))
        error(err.error || t('cancelFailed'))
      }
    } catch {
      error(t('cancelFailed'))
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-bold text-foreground">
          {t('management')}
        </h3>
        <div className="flex items-center gap-2">
          {enrollments.length > 0 && (
            <button
              onClick={() => exportToCSV(
                filtered,
                [
                  { key: 'userName', label: t('tableHeaders.name') },
                  { key: 'userPhone', label: t('tableHeaders.phone') },
                  { key: 'courseTitle', label: t('tableHeaders.course') },
                  { key: 'status', label: t('tableHeaders.status') },
                  { key: 'totalFee', label: 'Fee' },
                  { key: 'paidAmount', label: 'Paid' },
                  { key: 'dueAmount', label: 'Due' },
                  { key: 'discount', label: 'Discount' },
                  { key: 'enrolledAt', label: t('tableHeaders.enrolled') },
                ],
                'enrollments.csv',
              )}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="size-4" />
              CSV
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setShowAdd(true)
            setAddForm({
              userId: '',
              selectedCourseIds: [],
              notes: '',
              discount: '0',
            })
            setCourseSearch('')
            setAddError('')
          }}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
        >
          <Plus className="size-4" /> {t('newEnrollment')}
        </button>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v)
          resetPage()
        }}
        searchPlaceholder={t('searchPlaceholder')}
        filters={[
          {
            name: 'status',
            label: 'অবস্থা',
            type: 'select',
            options: STATUS_OPTIONS.map((s) => ({
              value: s.value,
              label: s.label,
            })),
            value: filter,
            onChange: (value) => {
              setFilter(value)
              resetPage()
            },
          },
          {
            name: 'course',
            label: 'কোর্স',
            type: 'select',
            options: activeCourses.map((c) => ({ value: c.id, label: c.title })),
            value: courseFilter === 'all' ? '' : courseFilter,
            onChange: (value) => {
              setCourseFilter(value || 'all')
              resetPage()
            },
          },
        ]}
      />

      {showAdd && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading font-semibold text-foreground">
              {t('newEnrollment')}
            </h4>
            <button
              onClick={() => setShowAdd(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-3">
            {addError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addError}
              </div>
            )}

            <div>
              <label className={labelCls}>{t('studentLabel')} *</label>
              <select
                value={addForm.userId}
                onChange={(e) =>
                  setAddForm({ ...addForm, userId: e.target.value })
                }
                className={inputCls}
              >
                <option value="">{t('studentLabel')} নির্বাচন করুন</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.phoneNumber ? ` (${s.phoneNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>{t('courseSelectLabel')} *</label>
                <span className="text-xs text-muted-foreground">
                  {addForm.selectedCourseIds.length}
                  {t('selectedCount')}
                </span>
              </div>
              <div className="mt-1 rounded-lg border border-border bg-background overflow-hidden">
                <div className="p-2 border-b border-border">
                  <input
                    type="text"
                    placeholder={t('courseSearchPlaceholder')}
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground border-b border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50">
                    <input
                      type="checkbox"
                      checked={
                        addForm.selectedCourseIds.length ===
                          filteredActiveCourses.length &&
                        filteredActiveCourses.length > 0
                      }
                      onChange={toggleAllCourses}
                      className="size-4 rounded border-border text-brand focus:ring-brand"
                    />
                    সকল কোর্স নির্বাচন করুন
                  </label>
                  {filteredActiveCourses.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={addForm.selectedCourseIds.includes(c.id)}
                        onChange={() => toggleCourse(c.id)}
                        className="size-4 rounded border-border text-brand focus:ring-brand"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{c.title}</span>
                        {c.courseCode && (
                          <span className="text-xs text-muted-foreground">
                            {c.courseCode}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        ৳{(c.discountFee || c.fee).toLocaleString()}
                      </span>
                    </label>
                  ))}
                  {filteredActiveCourses.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      কোনো কোর্স পাওয়া যায়নি
                    </div>
                  )}
                </div>
              </div>
            </div>

            {addForm.selectedCourseIds.length > 0 && (
              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {t('selectedCourses')}
                </p>
                <div className="space-y-1">
                  {addCourseFees.map((cf) => (
                    <div
                      key={cf.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground truncate">
                        {cf.title}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        ৳{cf.fee.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('totalFee')}
                    </span>
                    <span className="font-medium text-foreground">
                      ৳
                      {addCourseFees
                        .reduce((s, c) => s + c.fee, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <label className={labelCls}>{t('discountLabel')}</label>
                    <input
                      type="number"
                      min="0"
                      max={addMaxDiscount}
                      value={addForm.discount}
                      onChange={(e) =>
                        setAddForm({ ...addForm, discount: e.target.value })
                      }
                      placeholder="০"
                      className={inputCls}
                    />
                    {addDiscountNum > addMaxDiscount && (
                      <p className="mt-1 text-xs text-destructive">
                        {t('discountExceedsFee')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground">
                      {t('payableFee')}
                    </span>
                    <span className="font-semibold text-green">
                      ৳{addTotalFee.toLocaleString()}
                    </span>
                  </div>
                  {addDiscountNum > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t('totalDiscount')}: ৳
                      {(
                        addDiscountNum * addForm.selectedCourseIds.length
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>নোট</label>
              <input
                type="text"
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm({ ...addForm, notes: e.target.value })
                }
                placeholder={t('notesPlaceholder')}
                maxLength={1000}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {addForm.notes.length}/1000
              </p>
            </div>

            <button
              onClick={handleAdd}
              disabled={
                addSaving ||
                !addForm.userId ||
                addForm.selectedCourseIds.length === 0
              }
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
            >
              {addSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {addForm.selectedCourseIds.length > 1
                ? t('createEnrollments', {
                    count: addForm.selectedCourseIds.length,
                  })
                : t('createEnrollment')}
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading font-semibold text-foreground">
              {t('editTitle')} — {editing.userName || '—'}
            </h4>
            <button
              onClick={() => setEditing(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-3">
            {editError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>অবস্থা</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>নোট</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="নোট"
                  maxLength={1000}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {editForm.notes.length}/1000
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>শুরুর তারিখ</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>শেষের তারিখ</label>
                <input
                  type="date"
                  value={editForm.endDate}
                  min={editForm.startDate || undefined}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                  className={inputCls}
                />
                {editForm.startDate &&
                  editForm.endDate &&
                  editForm.endDate < editForm.startDate && (
                    <p className="mt-1 text-xs text-destructive">
                      শেষের তারিখ শুরুর তারিখের পরে হতে হবে
                    </p>
                  )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t('feeAndDiscount')}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">
                    {t('courseFee')}
                  </label>
                  <div className="mt-1 text-sm text-foreground">
                    ৳{editCourseFee.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('discountLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max={editCourseFee}
                    value={editForm.discount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, discount: e.target.value })
                    }
                    placeholder="০"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">
                    {t('payableFee')}
                  </label>
                  <div className="mt-1 text-sm font-semibold text-green">
                    ৳{editTotalFee.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                পরিশোধ: ৳{editing.paidAmount.toLocaleString()} | বকেয়: ৳
                {Math.max(
                  0,
                  editTotalFee - editing.paidAmount,
                ).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditSave}
                disabled={
                  editSaving ||
                  (!!editForm.startDate &&
                    !!editForm.endDate &&
                    editForm.endDate < editForm.startDate)
                }
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
              >
                {editSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pencil className="size-4" />
                )}
                সংরক্ষণ করুন
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-brand/5 p-3 border border-brand/20">
          <span className="text-sm font-medium text-brand">
            {selectedIds.length}
            {t('selectedCount')}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button
              onClick={async () => {
                const statusLabel = STATUS_OPTIONS.find(
                  (s) => s.value === bulkStatus,
                )?.label
                const ok = await confirm(
                  t('bulkStatusChangeConfirm', {
                    count: selectedIds.length,
                    status: statusLabel!,
                  }),
                )
                if (ok) {
                  setBulkAction('status')
                  handleBulkAction()
                }
              }}
              disabled={bulkSaving}
              size="sm"
            >
              {bulkSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {t('bulkUpdateStatus')}
            </Button>
            <Button
              onClick={async () => {
                const ok = await confirm(t('bulkCancelConfirm'))
                if (ok) {
                  setBulkAction('cancel')
                  handleBulkAction()
                }
              }}
              disabled={bulkSaving}
              variant="destructive"
              size="sm"
            >
              {bulkSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              {t('cancelAction')}
            </Button>
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-center font-semibold text-foreground w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paged.length && paged.length > 0}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-border text-brand focus:ring-brand"
                  />
                </th>
                {([
                  ['userName', t('tableHeaders.student')],
                  ['phone', t('tableHeaders.phone')],
                  ['courseTitle', t('tableHeaders.course')],
                ] as const).map(([key, label]) => (
                  <th key={key} className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer select-none hover:text-brand" onClick={() => {
                    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                    else { setSortKey(key); setSortDir('asc') }
                  }}>
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sortKey === key && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-foreground">{t('tableHeaders.discount')}</th>
                {(['totalFee', 'dueAmount'] as const).map((key) => (
                  <th key={key} className="px-4 py-3 text-center font-semibold text-foreground cursor-pointer select-none hover:text-brand" onClick={() => {
                    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                    else { setSortKey(key); setSortDir('asc') }
                  }}>
                    <span className="inline-flex items-center gap-1">
                      {key === 'totalFee' ? t('tableHeaders.totalFee') : t('tableHeaders.payment')}
                      {sortKey === key && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-foreground">{t('tableHeaders.due')}</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground cursor-pointer select-none hover:text-brand" onClick={() => {
                  if (sortKey === 'status') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                  else { setSortKey('status'); setSortDir('asc') }
                }}>
                  <span className="inline-flex items-center gap-1">
                    {t('tableHeaders.status')}
                    {sortKey === 'status' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">{t('tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8">
                    <EmptyState
                      title={search ? t('emptySearch') : t('emptyNoData')}
                      description={
                        search ? t('emptySearchHint') : t('emptyCreateHint')
                      }
                    />
                  </td>
                </tr>
              ) : (
                paged.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(e.id)}
                        onChange={() => toggleSelect(e.id)}
                        className="size-4 rounded border-border text-brand focus:ring-brand"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {e.userName || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.userPhone || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.courseTitle || '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {e.discount > 0 ? (
                        <span className="text-orange-600 dark:text-orange-400">
                          −৳{e.discount.toLocaleString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground">
                      ৳{e.totalFee.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-green">
                      ৳{e.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-gold font-medium">
                      ৳{e.dueAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EnrollmentStatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {e.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleEditClick(e)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              title={t('editAction')}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(e.id)}
                              disabled={cancelling === e.id}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              title={t('cancelAction')}
                            >
                              {cancelling === e.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Ban className="size-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">দেখুন:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value={10}>১০</option>
              <option value={25}>২৫</option>
              <option value={50}>৫০</option>
              <option value={100}>১০০</option>
            </select>
            <span className="text-sm text-muted-foreground">
              / {filtered.length} টি
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              পৃষ্ঠা {safePage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              পূর্ববর্তী
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="gap-1"
            >
              পরবর্তী
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
