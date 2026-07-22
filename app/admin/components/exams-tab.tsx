'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X, Clock, Loader2, Copy, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterBar } from '@/components/ui/filter-bar'
import { ExamStatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { DataTablePagination } from '@/components/ui/data-table'
import { exportToCSV } from '@/lib/csv-export'
import type { Exam, ExamSubmission } from './types'

export function ExamsPanel({
  exams,
  submissions,
  onRefresh,
}: {
  exams: Exam[]
  submissions: ExamSubmission[]
  onRefresh: () => void
}) {
  const t = useTranslations('admin.exams')
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExam, setEditingExam] = useState<string | null>(null)
  const [examForm, setExamForm] = useState({
    title: '',
    subject: '',
    duration: 15,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  })
  const [examPage, setExamPage] = useState(0)
  const [examPageSize, setExamPageSize] = useState(10)
  const [subPage, setSubPage] = useState(0)
  const [subPageSize, setSubPageSize] = useState(10)
  const [saving, setSaving] = useState(false)
  const [subjects, setSubjects] = useState<{ name: string }[]>([])
  const { confirm } = useToast()

  const DIFFICULTY_LABELS: Record<string, { label: string; cls: string }> = {
    easy: { label: t('difficultyEasy'), cls: 'bg-green/10 text-green' },
    medium: { label: t('difficultyMedium'), cls: 'bg-brand/10 text-brand' },
    hard: {
      label: t('difficultyHard'),
      cls: 'bg-destructive/10 text-destructive',
    },
  }

  useEffect(() => {
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setSubjects(d.data)
      })
      .catch(() => {})
  }, [])

  const [filterExam, setFilterExam] = useState<string>('all')
  const filteredSubmissions =
    filterExam === 'all'
      ? submissions
      : submissions.filter((s) => s.examId === filterExam)

  async function handleCreateExam() {
    if (!examForm.title.trim()) return
    setSaving(true)
    try {
      const method = editingExam ? 'PUT' : 'POST'
      const url = editingExam ? `/api/exams/${editingExam}` : '/api/exams'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm),
      })
      setExamForm({ title: '', subject: subjects[0]?.name || '', duration: 15, difficulty: 'medium' })
      setShowExamForm(false)
      setEditingExam(null)
      onRefresh()
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  function handleCloneExam(exam: Exam) {
    setExamForm({ title: `${exam.title} (Copy)`, subject: exam.subject, duration: exam.duration, difficulty: exam.difficulty })
    setEditingExam(null)
    setShowExamForm(true)
  }

  async function handleDeleteExam(id: string) {
    if (!(await confirm(t('deleteConfirm')))) return
    try {
      await fetch(`/api/exams/${id}`, { method: 'DELETE' })
      onRefresh()
    } catch (error) {
      console.error('Failed to delete exam:', error)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await fetch(`/api/exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      })
      onRefresh()
    } catch (error) {
      console.error('Failed to toggle exam:', error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-foreground">
            {t('management')}
          </h3>
          <button
            onClick={() => setShowExamForm(!showExamForm)}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            <Plus className="size-4" />
            {t('newExam')}
          </button>
        </div>

        {showExamForm && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-heading font-semibold text-foreground">
                {t('createForm')}
              </h4>
              <button
                onClick={() => setShowExamForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {t('formLabels.name')}
                  </label>
                  <input
                    type="text"
                    value={examForm.title}
                    onChange={(e) =>
                      setExamForm({ ...examForm, title: e.target.value })
                    }
                    placeholder={t('formLabels.namePlaceholder')}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {t('formLabels.subject')}
                  </label>
                  <select
                    value={examForm.subject}
                    onChange={(e) =>
                      setExamForm({ ...examForm, subject: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    {subjects.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {t('formLabels.duration')}
                  </label>
                  <input
                    type="number"
                    value={examForm.duration}
                    onChange={(e) =>
                      setExamForm({
                        ...examForm,
                        duration: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {t('formLabels.difficulty')}
                  </label>
                  <select
                    value={examForm.difficulty}
                    onChange={(e) =>
                      setExamForm({
                        ...examForm,
                        difficulty: e.target.value as
                          'easy' | 'medium' | 'hard',
                      })
                    }
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="easy">{t('difficultyEasy')}</option>
                    <option value="medium">{t('difficultyMedium')}</option>
                    <option value="hard">{t('difficultyHard')}</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreateExam}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {t('createButton')}
              </button>
            </div>
          </div>
        )}

        {exams.length === 0 ? (
          <EmptyState title={t('emptyExams')} />
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-end px-4 pt-3 pb-2">
              <button
                onClick={() => exportToCSV(
                  exams,
                  [
                    { key: 'title', label: t('tableHeaders.exam') },
                    { key: 'subject', label: t('tableHeaders.subject') },
                    { key: 'duration', label: t('tableHeaders.duration') },
                    { key: 'questionCount', label: t('tableHeaders.questions') },
                    { key: 'difficulty', label: t('tableHeaders.difficulty') },
                  ],
                  'exams.csv',
                )}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Download className="size-4" />
                CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      {t('tableHeaders.exam')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      {t('tableHeaders.subject')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">
                      {t('tableHeaders.duration')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">
                      {t('tableHeaders.questions')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">
                      {t('tableHeaders.submissions')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">
                      {t('tableHeaders.difficulty')}
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
                  {exams.slice(examPage * examPageSize, (examPage + 1) * examPageSize).map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {e.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-brand">
                          {e.subject}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {e.duration} {t('minutes')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-foreground">
                        {e.questionCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground">
                        {submissions.filter((s) => s.examId === e.id).length}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_LABELS[e.difficulty]?.cls || ''}`}
                        >
                          {DIFFICULTY_LABELS[e.difficulty]?.label ||
                            e.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(e.id, e.isActive)}
                          className="inline-flex cursor-pointer transition-colors"
                        >
                          <ExamStatusBadge status={e.isActive ? 'active' : 'inactive'} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleCloneExam(e)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            title={t('clone')}
                          >
                            <Copy className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(e.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataTablePagination
              currentPage={examPage + 1}
              totalPages={Math.ceil(exams.length / examPageSize)}
              pageSize={examPageSize}
              totalItems={exams.length}
              onPageChange={(p) => setExamPage(p - 1)}
              onPageSizeChange={(s) => { setExamPageSize(s); setExamPage(0) }}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-bold text-foreground">
            {t('resultsManagement')}
          </h3>
        </div>

        <FilterBar
          filters={[
            {
              name: 'exam',
              label: t('tableHeaders.exam'),
              type: 'select',
              value: filterExam === 'all' ? '' : filterExam,
              onChange: (v) => setFilterExam(v || 'all'),
              options: exams.map((ex) => ({ value: ex.id, label: ex.title })),
            },
          ]}
        />

        {filteredSubmissions.length === 0 ? (
          <EmptyState title={t('emptyResults')} />
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      {t('resultsTableHeaders.student')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      {t('resultsTableHeaders.exam')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">
                      {t('resultsTableHeaders.score')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">
                      {t('resultsTableHeaders.time')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      {t('resultsTableHeaders.date')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.slice(subPage * subPageSize, (subPage + 1) * subPageSize).map((s) => {
                    const pct =
                      s.total > 0 ? Math.round((s.score / s.total) * 100) : 0
                    const exam = exams.find((e) => e.id === s.examId)
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {s.userStudentId || s.userId.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {exam?.title || s.examId.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-foreground">
                            {s.score}
                          </span>
                          <span className="text-muted-foreground">
                            /{s.total}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {s.timeTaken ? `${s.timeTaken} ${t('seconds')}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString('bn-BD')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <DataTablePagination
              currentPage={subPage + 1}
              totalPages={Math.ceil(filteredSubmissions.length / subPageSize)}
              pageSize={subPageSize}
              totalItems={filteredSubmissions.length}
              onPageChange={(p) => setSubPage(p - 1)}
              onPageSizeChange={(s) => { setSubPageSize(s); setSubPage(0) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
