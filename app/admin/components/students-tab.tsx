'use client'

import { useState, useRef } from 'react'
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Loader2,
  Upload,
  Key,
  Download,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Student } from './types'
import { useToast } from '@/components/ui/toast'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar } from '@/components/ui/filter-bar'
import { DataTablePagination } from '@/components/ui/data-table'
import { exportToCSV } from '@/lib/csv-export'
import { StudentProfileModal } from './student-profile-modal'

function resizeImage(
  file: File,
  maxW = 800,
  maxH = 800,
  quality = 0.8,
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width: w, height: h } = img
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
    }
    img.src = url
  })
}

const inputCls =
  'mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
const labelCls = 'block text-sm font-medium text-foreground'

type EducationField = {
  result: string
  institution: string
  year: string
  roll: string
  registrationNo: string
  board: string
  photoUrl: string
}
type FormState = {
  name: string
  email: string
  password: string
  phoneNumber: string
  studentId: string
  image: string
  address: string
  village: string
  post: string
  policeStation: string
  district: string
  dateOfBirth: string
  guardianName: string
  guardianPhone: string
  institution: string
  ssc: EducationField
  hsc: EducationField
  honors: EducationField
}

function emptyEducation(): EducationField {
  return {
    result: '',
    institution: '',
    year: '',
    roll: '',
    registrationNo: '',
    board: '',
    photoUrl: '',
  }
}

function emptyForm(): FormState {
  return {
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    studentId: '',
    image: '',
    address: '',
    village: '',
    post: '',
    policeStation: '',
    district: '',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    institution: '',
    ssc: emptyEducation(),
    hsc: emptyEducation(),
    honors: emptyEducation(),
  }
}

function EduFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: EducationField
  onChange: (v: EducationField) => void
}) {
  const t = useTranslations('admin.students')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const boards = [
    t('boards.select'),
    t('boards.dhaka'),
    t('boards.rajshahi'),
    t('boards.chattogram'),
    t('boards.jessore'),
    t('boards.barisal'),
    t('boards.sylhet'),
    t('boards.rangpur'),
    t('boards.mymensingh'),
    t('boards.dinajpur'),
    t('boards.comilla'),
  ]

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const resized = await resizeImage(file)
    const formData = new FormData()
    formData.append('file', resized, 'photo.jpg')
    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        onChange({ ...value, photoUrl: data.url })
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            {t('formLabels.result')}
          </label>
          <input
            type="text"
            value={value.result}
            onChange={(e) => onChange({ ...value, result: e.target.value })}
            placeholder={t('formLabels.resultPlaceholder')}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            {t('formLabels.institution')}
          </label>
          <input
            type="text"
            value={value.institution}
            onChange={(e) =>
              onChange({ ...value, institution: e.target.value })
            }
            placeholder={t('formLabels.institutionPlaceholder')}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            {t('formLabels.year')}
          </label>
          <select
            value={value.year}
            onChange={(e) => onChange({ ...value, year: e.target.value })}
            className={inputCls}
          >
            <option value="">{t('formLabels.yearSelect')}</option>
            {Array.from({ length: 27 }, (_, i) => 2026 - i).map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            {t('formLabels.roll')}
          </label>
          <input
            type="text"
            value={value.roll}
            onChange={(e) => onChange({ ...value, roll: e.target.value })}
            placeholder={t('formLabels.rollPlaceholder')}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            {t('formLabels.registration')}
          </label>
          <input
            type="text"
            value={value.registrationNo}
            onChange={(e) =>
              onChange({ ...value, registrationNo: e.target.value })
            }
            placeholder={t('formLabels.registrationPlaceholder')}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            {t('formLabels.board')}
          </label>
          <select
            value={value.board}
            onChange={(e) => onChange({ ...value, board: e.target.value })}
            className={inputCls}
          >
            {boards.map((b, i) => (
              <option key={b} value={i === 0 ? '' : b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Upload className="size-3.5" /> {t('formLabels.certificatePhoto')}
          </button>
        </div>
        {value.photoUrl && (
          <div className="flex items-center gap-2">
            <img
              src={value.photoUrl}
              alt=""
              className="h-10 w-10 rounded object-cover border border-border"
            />
            <button
              type="button"
              onClick={() => onChange({ ...value, photoUrl: '' })}
              className="text-xs text-destructive hover:underline"
            >
              {t('formLabels.remove')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StudentPhotoUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const t = useTranslations('admin.students')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const resized = await resizeImage(file, 600, 600, 0.85)
      const formData = new FormData()
      formData.append('file', resized, 'photo.jpg')
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        onChange(data.url)
      }
    } catch {
      /* ignore */
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        {uploading ? t('formLabels.uploading') : t('formLabels.uploadPhoto')}
      </button>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('formLabels.pasteUrl')}
        className={inputCls}
      />
      {value && (
        <div className="flex items-center gap-2 shrink-0">
          <img
            src={value}
            alt=""
            className="h-10 w-10 rounded object-cover border border-border"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-destructive hover:underline"
          >
            {t('formLabels.remove')}
          </button>
        </div>
      )}
    </div>
  )
}

export function StudentsPanel({
  students,
  onRefresh,
}: {
  students: Student[]
  onRefresh: () => void
}) {
  const t = useTranslations('admin.students')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [resettingStudent, setResettingStudent] = useState<Student | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSaving, setResetSaving] = useState(false)
  const [profileStudent, setProfileStudent] = useState<Student | null>(null)
  const [enrollmentFilter, setEnrollmentFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const { success, error, confirm } = useToast()

  function handleEdit(s: Student) {
    setEditing(s)
    setForm({
      name: s.name,
      email: s.email,
      password: '',
      phoneNumber: s.phoneNumber || '',
      studentId: s.studentId || '',
      image: s.image || '',
      address: s.address || '',
      village: s.village || '',
      post: s.post || '',
      policeStation: s.policeStation || '',
      district: s.district || '',
      dateOfBirth: s.dateOfBirth || '',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
      institution: s.institution || '',
      ssc: s.ssc || emptyEducation(),
      hsc: s.hsc || emptyEducation(),
      honors: s.honors || emptyEducation(),
    })
    setFormError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return
    if (!editing && !form.password.trim()) {
      setFormError(t('formLabels.passwordRequired'))
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
      }
      if (!editing) body.password = form.password
      if (form.phoneNumber.trim()) body.phoneNumber = form.phoneNumber.trim()
      if (form.studentId.trim()) body.studentId = form.studentId.trim()
      if (form.image.trim()) body.image = form.image.trim()
      if (form.address.trim()) body.address = form.address.trim()
      if (form.village.trim()) body.village = form.village.trim()
      if (form.post.trim()) body.post = form.post.trim()
      if (form.policeStation.trim())
        body.policeStation = form.policeStation.trim()
      if (form.district.trim()) body.district = form.district.trim()
      if (form.dateOfBirth.trim()) body.dateOfBirth = form.dateOfBirth.trim()
      if (form.guardianName.trim()) body.guardianName = form.guardianName.trim()
      if (form.guardianPhone.trim())
        body.guardianPhone = form.guardianPhone.trim()
      if (form.institution.trim()) body.institution = form.institution.trim()
      if (
        form.ssc.result.trim() ||
        form.ssc.roll.trim() ||
        form.ssc.institution.trim()
      )
        body.ssc = form.ssc
      if (
        form.hsc.result.trim() ||
        form.hsc.roll.trim() ||
        form.hsc.institution.trim()
      )
        body.hsc = form.hsc
      if (
        form.honors.result.trim() ||
        form.honors.roll.trim() ||
        form.honors.institution.trim()
      )
        body.honors = form.honors

      const url = editing ? `/api/students/${editing.id}` : '/api/students'
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        onRefresh()
        setShowForm(false)
        setEditing(null)
        setForm(emptyForm())
        success(editing ? t('saveSuccess') : t('createSuccess'))
      } else {
        const err = await res.json().catch(() => ({ error: t('saveFailed') }))
        const msg = err.details
          ? Object.values(err.details).flat().join(', ')
          : err.error || t('saveFailed')
        setFormError(msg)
        error(msg)
      }
    } catch {
      setFormError(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm(t('deleteConfirm'))
    if (!ok) return
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      onRefresh()
      success(t('deleteSuccess'))
    } else {
      const err = await res.json().catch(() => ({}))
      error(err.error || t('deleteFailed'))
    }
  }

  async function handleResetPassword() {
    if (!resettingStudent || !newPassword.trim()) return
    setResetSaving(true)
    setResetError('')
    try {
      const res = await fetch(`/api/students/${resettingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      if (res.ok) {
        setResettingStudent(null)
        setNewPassword('')
      } else {
        const err = await res.json().catch(() => ({ error: t('resetFailed') }))
        setResetError(err.error || t('resetFailed'))
      }
    } catch {
      setResetError(t('resetFailed'))
    } finally {
      setResetSaving(false)
    }
  }

  const filtered = students
    .filter((s) => s.role === 'student')
    .filter((s) => {
      if (enrollmentFilter === 'admitted') return !!s.admissionId
      if (enrollmentFilter === 'non-admitted') return !s.admissionId
      return true
    })
    .filter(
      (s) =>
        !search ||
        [s.name, s.email, s.phoneNumber, s.studentId, s.district].some((f) =>
          (f || '').toLowerCase().includes(search.toLowerCase()),
        ),
    )
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-foreground">
          {t('management')}
        </h3>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button
              onClick={() => exportToCSV(
                filtered,
                [
                  { key: 'name', label: t('tableHeaders.name') },
                  { key: 'email', label: t('tableHeaders.email') },
                  { key: 'phoneNumber', label: t('tableHeaders.phone') },
                  { key: 'district', label: t('tableHeaders.district') },
                  { key: 'studentId', label: t('tableHeaders.studentId') },
                  { key: 'role', label: t('tableHeaders.role') },
                ],
                'students.csv',
              )}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="size-4" />
              CSV
            </button>
          )}
          <button
            onClick={() => {
              setShowForm(true)
              setEditing(null)
              setForm(emptyForm())
            }}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            <Plus className="size-4" /> {t('newStudent')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading font-semibold text-foreground">
              {editing ? t('editTitle') : t('formHeadingNew')}
            </h4>
            <button
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {formError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}

            {/* Personal info */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">
                {t('personalInfo')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t('formLabels.name')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('formLabels.namePlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('formLabels.email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="example@email.com"
                    className={inputCls}
                  />
                </div>
              </div>
              {!editing && (
                <div className="mt-3">
                  <label className={labelCls}>{t('formLabels.password')}</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={t('formLabels.passwordPlaceholder')}
                    className={inputCls}
                  />
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-3 mt-3">
                <div>
                  <label className={labelCls}>{t('formLabels.phone')}</label>
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                    placeholder={t('formLabels.phonePlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t('formLabels.studentId')}
                  </label>
                  <input
                    type="text"
                    value={form.studentId}
                    onChange={(e) =>
                      setForm({ ...form, studentId: e.target.value })
                    }
                    placeholder={t('formLabels.studentIdPlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t('formLabels.dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelCls}>{t('formLabels.image')}</label>
                <div className="flex items-center gap-3 mt-1">
                  <StudentPhotoUpload
                    value={form.image}
                    onChange={(url) => setForm({ ...form, image: url })}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">
                {t('formLabels.addressSection')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t('formLabels.village')}</label>
                  <input
                    type="text"
                    value={form.village}
                    onChange={(e) =>
                      setForm({ ...form, village: e.target.value })
                    }
                    placeholder={t('formLabels.villagePlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('formLabels.post')}</label>
                  <input
                    type="text"
                    value={form.post}
                    onChange={(e) => setForm({ ...form, post: e.target.value })}
                    placeholder={t('formLabels.postPlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t('formLabels.policeStation')}
                  </label>
                  <input
                    type="text"
                    value={form.policeStation}
                    onChange={(e) =>
                      setForm({ ...form, policeStation: e.target.value })
                    }
                    placeholder={t('formLabels.policeStationPlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('formLabels.district')}</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) =>
                      setForm({ ...form, district: e.target.value })
                    }
                    placeholder={t('formLabels.districtPlaceholder')}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelCls}>
                  {t('formLabels.fullAddress')}
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder={t('formLabels.fullAddressPlaceholder')}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Guardian */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">
                {t('formLabels.guardianSection')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    {t('formLabels.guardianName')}
                  </label>
                  <input
                    type="text"
                    value={form.guardianName}
                    onChange={(e) =>
                      setForm({ ...form, guardianName: e.target.value })
                    }
                    placeholder={t('formLabels.guardianNamePlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t('formLabels.guardianPhone')}
                  </label>
                  <input
                    type="text"
                    value={form.guardianPhone}
                    onChange={(e) =>
                      setForm({ ...form, guardianPhone: e.target.value })
                    }
                    placeholder={t('formLabels.phonePlaceholder')}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground border-b border-border pb-1">
                {t('formLabels.educationSection')}
              </p>
              <EduFields
                label={t('formLabels.ssc')}
                value={form.ssc}
                onChange={(v) => setForm({ ...form, ssc: v })}
              />
              <EduFields
                label={t('formLabels.hscOptional')}
                value={form.hsc}
                onChange={(v) => setForm({ ...form, hsc: v })}
              />
              <EduFields
                label={t('formLabels.honorsOptional')}
                value={form.honors}
                onChange={(v) => setForm({ ...form, honors: v })}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {editing ? t('editTitle') : t('formHeadingNew')}
            </button>
          </div>
        </div>
      )}

      <FilterBar
        searchPlaceholder={t('searchPlaceholder')}
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            name: 'enrollment',
            label: t('enrollmentStatus'),
            type: 'select',
            value: enrollmentFilter === 'all' ? '' : enrollmentFilter,
            onChange: (v) => { setEnrollmentFilter(v || 'all'); setPage(0) },
            options: [
              { value: 'all', label: t('filterAll') },
              { value: 'admitted', label: t('filterAdmitted') },
              { value: 'non-admitted', label: t('filterNonAdmitted') },
            ],
          },
        ]}
      />

      {resettingStudent && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading font-semibold text-foreground">
              {t('passwordResetHeading')} — {resettingStudent.name}
            </h4>
            <button
              onClick={() => {
                setResettingStudent(null)
                setNewPassword('')
                setResetError('')
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-3">
            {resetError && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {resetError}
              </div>
            )}
            <div>
              <label className={labelCls}>{t('newPasswordLabel')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('formLabels.passwordPlaceholder')}
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleResetPassword()
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPassword}
                disabled={resetSaving || newPassword.length < 6}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {resetSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Key className="size-4" />
                )}
                {t('updatePassword')}
              </button>
              <button
                onClick={() => {
                  setResettingStudent(null)
                  setNewPassword('')
                  setResetError('')
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.name')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.email')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.phone')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.district')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  {t('tableHeaders.studentId')}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">
                  {t('tableHeaders.role')}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={search ? t('emptySearch') : t('emptyNoData')}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <button
                        onClick={() => setProfileStudent(s)}
                        className="flex items-center gap-3 text-left hover:underline"
                      >
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.name}
                            className="size-10 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{s.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.phoneNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.district || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.studentId || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.role === 'admin' ? 'bg-brand/10 text-brand' : 'bg-green/10 text-green'}`}
                        >
                          {s.role === 'admin'
                            ? t('roleAdmin')
                            : t('roleStudent')}
                        </span>
                        {s.admissionId && (
                          <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                            {t('admissionBadge')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(s)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResettingStudent(s)
                            setNewPassword('')
                            setResetError('')
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-600"
                          title={t('passwordResetHeading')}
                        >
                          <Key className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <DataTablePagination
            currentPage={page + 1}
            totalPages={Math.ceil(filtered.length / pageSize)}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={(p) => setPage(p - 1)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
          />
        )}
      </div>

      <StudentProfileModal
        student={profileStudent}
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
      />
    </div>
  )
}
