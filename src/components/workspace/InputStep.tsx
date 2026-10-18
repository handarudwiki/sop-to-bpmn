import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardPaste, Download, FileText, RefreshCw, Table2, Type, Upload, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import JellyRadio from '../rb/JellyRadio'
import type { Scenario } from '../../lib/types'

interface Props {
  scenarios: Scenario[]
  selected: string
  onSelect: (id: string) => void
  onStart: () => void
}

type Mode = 'file' | 'text'
type Source = { kind: 'file'; name: string; size: number } | { kind: 'text'; chars: number; lines: number }

const EXAMPLES = [
  { id: 'kredit', file: 'sop-pengajuan-kredit.docx', label: 'SOP Pengajuan Kredit', note: 'Prosa bebas, gaya SOP perbankan', icon: FileText },
  { id: 'sop-ap', file: 'sop-ap-surat-keterangan.pdf', label: 'SOP AP Surat Keterangan', note: 'Tabel SOP AP pemerintah (fiktif)', icon: Table2 },
]

// Prototipe hanya mengenali file/teks contoh; ekstraksi isi dokumen sungguhan menyusul di Fase 2.
function detectName(name: string): string | null {
  if (/kredit/i.test(name)) return 'kredit'
  if (/surat|sop[-_ ]?ap/i.test(name)) return 'sop-ap'
  return null
}
function detectText(text: string): string | null {
  if (/surat keterangan|kasubbag|pemohon/i.test(text)) return 'sop-ap'
  if (/kredit/i.test(text)) return 'kredit'
  return null
}

function exampleText(s: Scenario): string {
  if (s.kind === 'prosa') return `${s.title}\n\n${s.segments.map((x, i) => `${i + 1}. ${x.text}`).join('\n')}`
  const head = 'No | Kegiatan | Pelaksana | Kelengkapan | Waktu | Output'
  const rows = s.segments.map((x, i) => `${i + 1} | ${x.text} | ${x.actor} | ${x.kelengkapan} | ${x.waktu} | ${x.output}`)
  return `${s.title}\n\n${head}\n${rows.join('\n')}`
}

const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`)
const ease = [0.16, 1, 0.3, 1] as const

export default function InputStep({ scenarios, onSelect, onStart }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>('file')
  const [drag, setDrag] = useState(false)
  const [reading, setReading] = useState(false)
  const [source, setSource] = useState<Source | null>(null)
  const [matched, setMatched] = useState<Scenario | null>(null)
  const [text, setText] = useState('')

  const recognize = (src: Source, id: string | null, delay = 700) => {
    setSource(src)
    setMatched(null)
    setReading(true)
    const t = setTimeout(() => {
      const sc = scenarios.find((s) => s.id === id) ?? null
      if (sc) onSelect(sc.id)
      setMatched(sc)
      setReading(false)
    }, delay)
    return () => clearTimeout(t)
  }

  const acceptFile = (f: File) => recognize({ kind: 'file', name: f.name, size: f.size }, detectName(f.name))

  const useExampleFile = async (name: string) => {
    const blob = await (await fetch(`/examples/${name}`)).blob()
    acceptFile(new File([blob], name, { type: blob.type }))
  }

  useEffect(() => {
    if (mode !== 'text') return
    if (!text.trim()) {
      setSource(null)
      setMatched(null)
      return
    }
    const t = setTimeout(() => recognize({ kind: 'text', chars: text.length, lines: text.split('\n').filter((l) => l.trim()).length }, detectText(text), 500), 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mode])

  const switchMode = (m: Mode) => {
    setMode(m)
    setSource(null)
    setMatched(null)
    setReading(false)
  }

  const statusLabel = source?.kind === 'file' ? source.name : 'Teks yang ditempel'
  const statusMeta = source
    ? source.kind === 'file'
      ? kb(source.size)
      : `${source.lines} baris · ${source.chars} karakter`
    : ''

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="serif text-[44px] leading-[1.02]">Masukkan dokumen SOP</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Unggah file atau tempel teks SOP. Prosa bebas maupun tabel SOP AP.</p>
        </div>

        <JellyRadio
          items={[
            { value: 'file', label: 'Unggah file', icon: <Upload size={14} aria-hidden="true" /> },
            { value: 'text', label: 'Tempel teks', icon: <Type size={14} aria-hidden="true" /> },
          ]}
          value={mode}
          onChange={(v) => switchMode(v as Mode)}
          size="md"
          chipColor="var(--color-surface)"
          activeColor="var(--color-ink)"
          textColor="var(--color-ink-2)"
          activeTextColor="var(--color-accent-ink)"
          jelly={0.25}
          bounce={0.1}
          swell={0.05}
          barge={3}
          radius={999}
          ariaLabel="Cara memasukkan SOP"
        />

        <AnimatePresence mode="wait" initial={false}>
          {mode === 'file' ? (
            <motion.div key="file" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease }}>
              <button
                type="button"
                onClick={() => input.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDrag(true)
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDrag(false)
                  const f = e.dataTransfer.files[0]
                  if (f) acceptFile(f)
                }}
                className={`group relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-[20px] border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
                  drag ? 'scale-[1.01] border-accent bg-accent-soft' : 'border-rule-2 bg-surface/70 hover:border-accent-line hover:bg-surface'
                }`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200 ${
                    drag ? 'bg-accent text-accent-ink' : 'bg-ink text-accent-ink group-hover:bg-accent-strong'
                  }`}
                >
                  <Upload size={22} aria-hidden="true" />
                </span>
                <span className="text-[16px] font-medium text-ink">{drag ? 'Lepaskan untuk mengunggah' : 'Seret file ke sini, atau klik untuk memilih'}</span>
                <span className="font-mono text-[11.5px] text-muted">.docx · .pdf · .txt · maks. 10 MB</span>
              </button>
              <input
                ref={input}
                type="file"
                accept=".docx,.pdf,.txt"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) acceptFile(f)
                  e.target.value = ''
                }}
              />
            </motion.div>
          ) : (
            <motion.div key="text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease }}>
              <div className="overflow-hidden rounded-[20px] border border-rule-2 bg-surface shadow-soft focus-within:border-accent-line">
                <label htmlFor="sop-text" className="sr-only">
                  Teks SOP
                </label>
                <textarea
                  id="sop-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={9}
                  placeholder={'Tempel isi SOP di sini, misalnya:\n1. Petugas menerima pengajuan kredit.\n2. Petugas memeriksa kelengkapan dokumen.\n…'}
                  className="block w-full resize-y bg-transparent px-5 py-4 text-[14.5px] leading-relaxed text-ink outline-none placeholder:text-faint"
                />
                <div className="flex items-center justify-between gap-3 border-t border-rule bg-paper px-4 py-2.5">
                  <span className="font-mono text-[11px] text-muted">{text.length} karakter</span>
                  <div className="flex items-center gap-2">
                    {text && (
                      <button onClick={() => setText('')} className="text-[12.5px] text-muted hover:text-ink">
                        Kosongkan
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          setText(await navigator.clipboard.readText())
                        } catch {
                          document.getElementById('sop-text')?.focus()
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-full border border-rule-2 bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:border-accent-line hover:text-accent-strong"
                    >
                      <ClipboardPaste size={13} aria-hidden="true" /> Tempel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {source && (
            <motion.div
              key={statusLabel + String(reading)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className={`rounded-[16px] border p-4 shadow-soft ${
                reading ? 'border-rule bg-surface' : matched ? 'border-ok/40 bg-ok-soft' : 'border-warn/50 bg-warn-soft'
              }`}
            >
              <div className="flex items-center gap-3">
                {reading ? (
                  <RefreshCw size={18} className="shrink-0 animate-spin text-accent" aria-hidden="true" />
                ) : matched ? (
                  <CheckCircle2 size={18} className="shrink-0 text-ok" aria-hidden="true" />
                ) : (
                  <AlertTriangle size={18} className="shrink-0 text-warn-ink" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{statusLabel}</p>
                  <p className="font-mono text-[11px] text-muted">
                    {statusMeta} · {reading ? 'membaca dokumen…' : matched ? `terdeteksi: ${matched.kindLabel}` : 'belum dikenali'}
                  </p>
                </div>
                {!reading && source.kind === 'file' && (
                  <button onClick={() => input.current?.click()} className="shrink-0 text-[12.5px] font-medium text-muted hover:text-ink">
                    Ganti
                  </button>
                )}
              </div>
              {!reading && !matched && (
                <p className="mt-3 text-[13px] leading-relaxed text-warn-ink">
                  Prototipe ini baru memproses dua dokumen contoh di bawah. {mode === 'file' ? 'Unduh salah satunya, lalu unggah kembali.' : 'Isi teks dengan salah satu contoh.'}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onStart} disabled={!matched || reading} className="btn btn-primary w-full justify-center py-4 text-[15px]">
          Ekstrak proses <ArrowRight size={16} aria-hidden="true" />
        </button>

        <div>
          <p className="mono-label text-muted">{mode === 'file' ? 'File contoh untuk demo' : 'Teks contoh untuk demo'}</p>
          <ul className="mt-3 space-y-2.5">
            {EXAMPLES.map((ex) => {
              const sc = scenarios.find((s) => s.id === ex.id)!
              return (
                <li key={ex.id} className="card flex items-center gap-3 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-ink-2">
                    <ex.icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{ex.label}</p>
                    <p className="truncate font-mono text-[11px] text-muted">{mode === 'file' ? `${ex.file} · ${ex.note}` : ex.note}</p>
                  </div>
                  {mode === 'file' ? (
                    <>
                      <a
                        href={`/examples/${ex.file}`}
                        download
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-rule-2 bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:border-accent-line hover:text-accent-strong"
                      >
                        <Download size={13} aria-hidden="true" /> Unduh
                      </a>
                      <button onClick={() => useExampleFile(ex.file)} className="shrink-0 text-[12.5px] font-medium text-accent-strong hover:underline">
                        Pakai
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setText(exampleText(sc))}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-rule-2 bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:border-accent-line hover:text-accent-strong"
                    >
                      <ClipboardPaste size={13} aria-hidden="true" /> Isi teks
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <section className="card min-w-0 self-start overflow-hidden" aria-label="Pratinjau dokumen">
        <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper px-5 py-3">
          <span className="truncate font-mono text-[12px] text-ink-2">{matched ? statusLabel : 'Pratinjau dokumen'}</span>
          <span className="mono-label shrink-0 text-muted">{matched ? 'isi terbaca' : 'menunggu dokumen'}</span>
        </div>
        <AnimatePresence mode="wait">
          {matched ? (
            <motion.div key={matched.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="p-5 sm:p-8">
              <h2 className="serif text-[30px] leading-tight">{matched.title}</h2>
              {matched.kind === 'prosa' ? (
                <ol className="mt-6 max-w-[46rem] space-y-3 text-[16px] leading-relaxed text-ink-2">
                  {matched.segments.map((seg, i) => (
                    <li key={seg.id} className="flex gap-3">
                      <span className="w-5 shrink-0 text-right font-mono text-[13px] text-faint">{i + 1}.</span>
                      {seg.text}
                    </li>
                  ))}
                </ol>
              ) : (
                <SopApTable s={matched} />
              )}
              <div className="mt-8 rounded-[14px] border border-rule bg-paper p-4">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-muted" aria-hidden="true" />
                  <h3 className="text-[14px] font-semibold">Struktur Organisasi workspace</h3>
                </div>
                <p className="mt-1 text-[13px] text-muted">Dipakai untuk memetakan aktor di SOP ke jabatan yang ada.</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {matched.orgRoles.map((r) => (
                    <li key={r} className="rounded-full border border-rule bg-surface px-2.5 py-1 text-[12.5px] text-ink-2">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
              {[
                { icon: FileText, t: 'Prosa bebas', d: 'Kalimat dinomori S1, S2, … dan menjadi jangkar jejak setiap elemen BPMN.' },
                { icon: Table2, t: 'Tabel SOP AP', d: 'Kolom Pelaksana jadi lane, Kelengkapan jadi field form, Waktu jadi SLA.' },
              ].map((x) => (
                <div key={x.t} className="rounded-[14px] border border-dashed border-rule-2 p-5">
                  <x.icon size={20} className="text-accent" aria-hidden="true" />
                  <p className="mt-3 text-[15px] font-semibold text-ink">{x.t}</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{x.d}</p>
                </div>
              ))}
              <p className="text-[13px] text-muted sm:col-span-2">Isi dokumen akan tampil di sini setelah file diunggah atau teks ditempel.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

function SopApTable({ s }: { s: Scenario }) {
  const actors = [...new Set(s.segments.map((x) => x.actor!))]
  return (
    <div className="mt-6 space-y-5">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-[auto_minmax(0,1fr)]">
        {s.identity?.map((it) => (
          <div key={it.label} className="contents">
            <dt className="font-mono text-[11.5px] text-muted uppercase">{it.label}</dt>
            <dd className="text-ink-2">{it.value}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto scroll-thin rounded-[12px] border border-rule">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-paper-2 text-left">
              <th rowSpan={2} className="border-b border-rule px-3 py-2 font-mono text-[11px] font-medium text-muted">NO</th>
              <th rowSpan={2} className="border-b border-rule px-3 py-2 font-mono text-[11px] font-medium text-muted">KEGIATAN</th>
              <th colSpan={actors.length} className="border-b border-l border-rule px-3 py-2 text-center font-mono text-[11px] font-medium text-muted">
                PELAKSANA
              </th>
              <th colSpan={3} className="border-b border-l border-rule px-3 py-2 text-center font-mono text-[11px] font-medium text-muted">
                MUTU BAKU
              </th>
            </tr>
            <tr className="bg-paper-2 text-left">
              {actors.map((a) => (
                <th key={a} className="border-b border-l border-rule px-2 py-2 text-center text-[11.5px] font-medium text-ink-2">
                  {a}
                </th>
              ))}
              {['Kelengkapan', 'Waktu', 'Output'].map((h) => (
                <th key={h} className="border-b border-l border-rule px-2 py-2 text-[11.5px] font-medium text-ink-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.segments.map((seg, i) => (
              <tr key={seg.id} className="align-top">
                <td className="border-b border-rule px-3 py-2.5 font-mono text-faint">{i + 1}</td>
                <td className="border-b border-rule px-3 py-2.5 text-ink">{seg.text}</td>
                {actors.map((a) => (
                  <td key={a} className="border-b border-l border-rule px-2 py-2.5 text-center">
                    {seg.actor === a && <span className="inline-block h-3.5 w-6 rounded-[3px] border border-ink-2 bg-paper-2" aria-label="pelaksana" />}
                  </td>
                ))}
                <td className="border-b border-l border-rule px-2 py-2.5 text-ink-2">{seg.kelengkapan}</td>
                <td className="border-b border-l border-rule px-2 py-2.5 whitespace-nowrap text-ink-2">{seg.waktu}</td>
                <td className="border-b border-l border-rule px-2 py-2.5 text-ink-2">{seg.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
