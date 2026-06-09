'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, RotateCcw, Eye, Pencil, Trash2, GitCompare, Loader2, ArrowLeft, Check, Globe } from 'lucide-react'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'
import type { BioVersionSummary } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  // Load a version into the builder as the current working version.
  onRestore: (html: string, style: string | null, versionNo: number) => void
}

const SOURCE_META: Record<string, { label: string; color: string; pale: string }> = {
  generate:    { label: 'Generated', color: C.teal,    pale: C.paleTeal },
  refine:      { label: 'Refined',   color: C.gold,    pale: C.paleGold },
  manual_edit: { label: 'Edited',    color: C.plum,    pale: C.palePlum },
  publish:     { label: 'Published', color: C.success, pale: '#D1EBE0' },
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}

type Mode =
  | { kind: 'list' }
  | { kind: 'preview'; html: string; label: string }
  | { kind: 'compare'; a: { html: string; label: string }; b: { html: string; label: string } }

export default function HistoryDrawer({ open, onClose, onRestore }: Props) {
  const { toast } = useToast()
  const [versions, setVersions] = useState<BioVersionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [compareSel, setCompareSel] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bio/versions')
      const data = await res.json()
      setVersions(data.versions ?? [])
    } catch {
      setVersions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setMode({ kind: 'list' })
      setCompareSel([])
      load()
    }
  }, [open, load])

  async function fetchHtml(id: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/bio/versions/${id}?render=preview`)
      if (!res.ok) return null
      const data = await res.json()
      return data.html as string
    } catch {
      return null
    }
  }

  function labelFor(v: BioVersionSummary): string {
    return v.label?.trim() || `v${v.version_no}`
  }

  async function handlePreview(v: BioVersionSummary) {
    setBusyId(v.id)
    const html = await fetchHtml(v.id)
    setBusyId(null)
    if (!html) { toast('Could not load this version', 'error'); return }
    setMode({ kind: 'preview', html, label: labelFor(v) })
  }

  async function handleRestore(v: BioVersionSummary) {
    setBusyId(v.id)
    try {
      const res = await fetch(`/api/bio/versions/${v.id}/restore`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Restore failed', 'error'); return }
      onRestore(data.html, data.style ?? null, data.version_no ?? v.version_no)
      toast(`Restored ${labelFor(v)} — publish to make it live`)
      onClose()
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(v: BioVersionSummary) {
    if (!confirm(`Delete ${labelFor(v)} from history? This can't be undone.`)) return
    setBusyId(v.id)
    try {
      const res = await fetch(`/api/bio/versions/${v.id}`, { method: 'DELETE' })
      if (!res.ok) { toast('Delete failed', 'error'); return }
      setVersions(prev => prev.filter(x => x.id !== v.id))
      setCompareSel(prev => prev.filter(x => x !== v.id))
    } finally {
      setBusyId(null)
    }
  }

  function startRename(v: BioVersionSummary) {
    setRenameId(v.id)
    setRenameText(v.label ?? '')
  }

  async function saveRename(v: BioVersionSummary) {
    const label = renameText.trim()
    setRenameId(null)
    try {
      const res = await fetch(`/api/bio/versions/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!res.ok) { toast('Rename failed', 'error'); return }
      setVersions(prev => prev.map(x => (x.id === v.id ? { ...x, label: label || null } : x)))
    } catch {
      toast('Rename failed', 'error')
    }
  }

  function toggleCompare(id: string) {
    setCompareSel(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id],
    )
  }

  async function runCompare() {
    if (compareSel.length !== 2) return
    setLoading(true)
    const [aV, bV] = compareSel.map(id => versions.find(v => v.id === id)!)
    const [aHtml, bHtml] = await Promise.all([fetchHtml(aV.id), fetchHtml(bV.id)])
    setLoading(false)
    if (!aHtml || !bHtml) { toast('Could not load versions to compare', 'error'); return }
    setMode({
      kind: 'compare',
      a: { html: aHtml, label: labelFor(aV) },
      b: { html: bHtml, label: labelFor(bV) },
    })
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70 }}>
      <div onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(29,46,54,0.42)', backdropFilter: 'blur(2px)' }}/>
      <div
        className="bio-history-panel"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: mode.kind === 'list' ? 'min(440px, 94vw)' : 'min(960px, 96vw)',
          background: C.bg, boxShadow: '-8px 0 40px rgba(29,46,54,0.25)',
          display: 'flex', flexDirection: 'column',
        }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
          {mode.kind !== 'list' && (
            <button onClick={() => setMode({ kind: 'list' })}
              className="flex items-center gap-1 text-sm rounded-lg px-2 py-1"
              style={{ color: C.inkMuted, background: C.bgSoft, border: `1px solid ${C.border}` }}>
              <ArrowLeft size={14}/> Back
            </button>
          )}
          <div className="flex-1">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: C.inkStrong, fontWeight: 600 }}>
              {mode.kind === 'list' ? 'Version history' : mode.kind === 'preview' ? `Preview — ${mode.label}` : 'Compare versions'}
            </h2>
            {mode.kind === 'list' && (
              <p className="text-xs" style={{ color: C.inkFaint }}>
                Every generation, refine, edit and publish is saved. Restore any version below.
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5" style={{ color: C.inkFaint, background: C.bgSoft }}>
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        {mode.kind === 'list' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
            {loading && (
              <div className="flex items-center justify-center py-16" style={{ color: C.inkFaint }}>
                <Loader2 size={20} className="animate-spin"/>
              </div>
            )}

            {!loading && versions.length === 0 && (
              <div className="text-center py-16 px-6">
                <p className="text-sm" style={{ color: C.inkMuted }}>No versions yet.</p>
                <p className="text-xs mt-1" style={{ color: C.inkFaint }}>
                  Generate or publish a page and it will show up here. (If you just set this up, run the
                  bio_page_versions migration in Supabase.)
                </p>
              </div>
            )}

            {!loading && versions.map(v => {
              const meta = SOURCE_META[v.source] ?? SOURCE_META.generate
              const selected = compareSel.includes(v.id)
              const isBusy = busyId === v.id
              return (
                <div key={v.id} className="rounded-xl p-3"
                  style={{
                    background: C.card,
                    border: `1px solid ${v.is_current ? C.teal + '80' : selected ? C.gold + '80' : C.border}`,
                    boxShadow: v.is_current ? `0 0 0 2px ${C.teal}22` : '0 1px 6px rgba(38,63,73,0.05)',
                  }}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: meta.pale, color: meta.color }}>
                          {meta.label}
                        </span>
                        {v.is_published_snapshot && (
                          <span title="Published snapshot"><Globe size={12} style={{ color: C.success }}/></span>
                        )}
                        {v.is_current && (
                          <span className="text-xs font-semibold" style={{ color: C.teal }}>· current</span>
                        )}
                      </div>

                      {renameId === v.id ? (
                        <input autoFocus value={renameText}
                          onChange={e => setRenameText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveRename(v); if (e.key === 'Escape') setRenameId(null) }}
                          onBlur={() => saveRename(v)}
                          placeholder={`v${v.version_no}`}
                          className="mt-1.5 w-full text-sm rounded-md px-2 py-1"
                          style={{ background: C.bgSoft, border: `1px solid ${C.teal}`, color: C.ink, outline: 'none' }}/>
                      ) : (
                        <p className="text-sm font-medium mt-1.5 truncate" style={{ color: C.inkStrong }}>
                          {v.label?.trim() || `Version ${v.version_no}`}
                        </p>
                      )}

                      <p className="text-xs mt-0.5" style={{ color: C.inkFaint }}>
                        {relativeTime(v.created_at)}
                        {v.style ? ` · ${v.style.replace('_', ' ')}` : ''}
                        {v.duration_seconds ? ` · ${Math.round(v.duration_seconds)}s` : ''}
                      </p>
                    </div>

                    <label className="flex items-center gap-1 text-xs cursor-pointer flex-shrink-0 px-1.5 py-1 rounded-md"
                      title="Select to compare"
                      style={{ color: selected ? C.gold : C.inkFaint, background: selected ? C.paleGold : 'transparent' }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleCompare(v.id)}
                        style={{ accentColor: C.gold }}/>
                      cmp
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <button onClick={() => handleRestore(v)} disabled={isBusy}
                      className="flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 font-semibold disabled:opacity-50"
                      style={{ background: C.teal, color: 'white' }}>
                      {isBusy ? <Loader2 size={12} className="animate-spin"/> : <RotateCcw size={12}/>} Restore
                    </button>
                    <button onClick={() => handlePreview(v)} disabled={isBusy}
                      className="flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 disabled:opacity-50"
                      style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                      <Eye size={12}/> Preview
                    </button>
                    <button onClick={() => startRename(v)}
                      className="flex items-center gap-1 text-xs rounded-lg px-2 py-1.5"
                      style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                      <Pencil size={12}/>
                    </button>
                    <button onClick={() => handleDelete(v)} disabled={isBusy}
                      className="flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 disabled:opacity-50"
                      style={{ background: '#F5DDD9', color: C.danger, border: `1px solid ${C.danger}30` }}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Compare action bar */}
        {mode.kind === 'list' && compareSel.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between gap-2"
            style={{ borderTop: `1px solid ${C.border}`, background: C.card }}>
            <span className="text-xs" style={{ color: C.inkMuted }}>{compareSel.length}/2 selected to compare</span>
            <button onClick={runCompare} disabled={compareSel.length !== 2}
              className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 font-semibold disabled:opacity-40"
              style={{ background: C.gold, color: C.inkStrong }}>
              <GitCompare size={14}/> Compare
            </button>
          </div>
        )}

        {/* Preview pane */}
        {mode.kind === 'preview' && (
          <div className="flex-1 overflow-hidden p-4">
            <iframe srcDoc={mode.html} title="Version preview" sandbox="allow-scripts"
              style={{ width: '100%', height: '100%', border: `1px solid ${C.border}`, borderRadius: 12, background: '#fff' }}/>
          </div>
        )}

        {/* Compare pane */}
        {mode.kind === 'compare' && (
          <div className="flex-1 overflow-hidden p-4 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[mode.a, mode.b].map((side, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-xl" style={{ border: `1px solid ${C.border}` }}>
                <div className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                  style={{ background: C.bgSoft, color: C.inkStrong, borderBottom: `1px solid ${C.border}` }}>
                  <Check size={11} style={{ color: i === 0 ? C.teal : C.gold }}/> {side.label}
                </div>
                <iframe srcDoc={side.html} title={`Compare ${i}`} sandbox="allow-scripts"
                  style={{ flex: 1, width: '100%', border: 'none', background: '#fff' }}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
