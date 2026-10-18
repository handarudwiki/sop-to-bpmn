import { AnimatePresence, motion } from 'motion/react'
import { Check, Download, Maximize2, Minus, Plus, RotateCcw, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import CountUp from '../rb/CountUp'
import JellyRadio from '../rb/JellyRadio'
import Diagram from '../Diagram'
import { buildGraph, graphStats, type Answers } from '../../lib/graph'
import { layoutGraph } from '../../lib/layout'
import { toBpmnXml } from '../../lib/bpmn'
import type { Graph, Question, Ref, Scenario } from '../../lib/types'
import { FormTab, MappingTab, XmlTab } from './Tabs'

const ease = [0.16, 1, 0.3, 1] as const
type Tab = 'diagram' | 'form' | 'jabatan' | 'xml'

export default function Review({ scenario, onRestart }: { scenario: Scenario; onRestart: () => void }) {
  const [answers, setAnswers] = useState<Answers>({})
  const [selectedRef, setSelectedRef] = useState<Ref | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [flashQ, setFlashQ] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('diagram')

  const graph = useMemo(() => buildGraph(scenario, answers), [scenario, answers])
  const layout = useMemo(() => layoutGraph(graph), [graph])
  const stats = graphStats(graph)
  const xml = useMemo(() => toBpmnXml(scenario, graph), [scenario, graph])
  const fileName = `${scenario.id === 'kredit' ? 'pengajuan-kredit' : 'penerbitan-surat-keterangan'}.bpmn`

  const node = selectedNode ? graph.nodes.find((n) => n.id === selectedNode) : undefined
  const activeRefs = useMemo(() => new Set<Ref>(selectedRef ? [selectedRef] : (node?.refs ?? [])), [selectedRef, node])
  const openCount = scenario.questions.filter((q) => !answers[q.id]).length

  const download = () => {
    const blob = new Blob([xml], { type: 'application/xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const focusQuestion = (qid: string) => {
    setFlashQ(qid)
    document.getElementById(`q-${qid}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setTimeout(() => setFlashQ(null), 1400)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="serif text-[36px] leading-[1.02]">{scenario.processName}</h1>
            <span className="mono-label rounded-[4px] bg-paper-2 px-2 py-1 text-muted">{scenario.kindLabel}</span>
          </div>
          <p className="mt-1 font-mono text-[12px] text-muted">
            Draf dari {scenario.fileName} · {scenario.segments.length} {scenario.kind === 'prosa' ? 'kalimat' : 'baris'} sumber
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-6">
          <Stat label="Aktor" value={stats.actors} />
          <Stat label="Task" value={stats.tasks} />
          <Stat label="Gateway" value={stats.gateways} />
          <Stat label="Field form" value={stats.fields} />
          <Stat label="Tertelusur" value={stats.tracedPct} suffix="%" accent />
          <Stat label="Pertanyaan" value={openCount} warn={openCount > 0} />
        </dl>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button onClick={onRestart} className="btn btn-ghost">
            <RotateCcw size={15} aria-hidden="true" /> Dokumen lain
          </button>
          <button onClick={download} className="btn btn-primary">
            <Download size={15} aria-hidden="true" /> Ekspor .bpmn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <SourcePanel
          scenario={scenario}
          graph={graph}
          activeRefs={activeRefs}
          selectedRef={selectedRef}
          onSelect={(r) => {
            setSelectedNode(null)
            setSelectedRef((cur) => (cur === r ? null : r))
          }}
        />

        <div className="min-w-0 space-y-5">
          <QuestionsRow
            questions={scenario.questions}
            answers={answers}
            flash={flashQ}
            onAnswer={(qid, oid) => {
              setAnswers((a) => ({ ...a, [qid]: oid }))
              setSelectedNode(null)
              setSelectedRef(null)
            }}
            onUndo={(qid) =>
              setAnswers((a) => {
                const next = { ...a }
                delete next[qid]
                return next
              })
            }
            onHover={(refs) => {
              setSelectedNode(null)
              setSelectedRef(refs?.[0] ?? null)
            }}
          />

          <section className="card" aria-label="Hasil">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
              <JellyRadio
                items={[
                  { value: 'diagram', label: 'Diagram' },
                  { value: 'form', label: 'Form' },
                  { value: 'jabatan', label: 'Jabatan' },
                  { value: 'xml', label: 'BPMN XML' },
                ]}
                value={tab}
                onChange={(v) => setTab(v as Tab)}
                size="sm"
                chipColor="var(--color-paper-2)"
                activeColor="var(--color-graphite)"
                textColor="var(--color-ink-2)"
                activeTextColor="var(--color-on-graphite)"
                jelly={0.25}
                bounce={0.1}
                swell={0.06}
                barge={3}
                radius={6}
                ariaLabel="Tampilan hasil"
              />
              <Legend />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {tab === 'diagram' && (
                  <DiagramPanel
                    graph={graph}
                    layout={layout}
                    scenario={scenario}
                    activeRefs={activeRefs}
                    selectedNode={selectedNode}
                    onSelectNode={(id) => {
                      setSelectedRef(null)
                      setSelectedNode(id)
                    }}
                    onSelectQuestion={focusQuestion}
                  />
                )}
                {tab === 'form' && <FormTab graph={graph} />}
                {tab === 'jabatan' && <MappingTab scenario={scenario} graph={graph} />}
                {tab === 'xml' && <XmlTab xml={xml} fileName={fileName} onDownload={download} />}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, suffix, accent, warn }: { label: string; value: number; suffix?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="mono-label text-muted">{label}</dt>
      <dd className={`serif text-[34px] leading-none tabular-nums ${warn ? 'text-warn-ink' : accent ? 'text-accent-strong' : 'text-ink'}`}>
        <CountUp to={value} duration={0.9} trigger="load" />
        {suffix}
      </dd>
    </div>
  )
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
      <li className="flex items-center gap-1.5">
        <span className="rounded-[3px] bg-accent-soft px-1 font-mono text-[10px] font-semibold text-accent-strong">S2</span> sumber
      </li>
      <li className="flex items-center gap-1.5">
        <span className="rounded-[3px] bg-ok-soft px-1 font-mono text-[10px] font-semibold text-ok">P1 ✓</span> dari jawaban
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-5 rounded-[3px] border border-dashed border-warn bg-warn-soft" /> perlu jawaban
      </li>
    </ul>
  )
}

function SourcePanel({
  scenario,
  graph,
  activeRefs,
  selectedRef,
  onSelect,
}: {
  scenario: Scenario
  graph: Graph
  activeRefs: Set<Ref>
  selectedRef: Ref | null
  onSelect: (r: Ref) => void
}) {
  const derived = (r: Ref) => graph.nodes.filter((n) => n.refs.includes(r)).length
  return (
    <aside className="min-w-0 card xl:sticky xl:top-20 xl:self-start" aria-label="Sumber SOP">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="text-[15px] font-semibold">Sumber SOP</h2>
        <span className="mono-label text-muted">klik untuk menelusuri</span>
      </div>
      <ol className="max-h-[70vh] space-y-1.5 overflow-y-auto p-2.5 scroll-thin">
        {scenario.segments.map((seg) => {
          const on = activeRefs.has(seg.id)
          return (
            <li key={seg.id}>
              <button
                onClick={() => onSelect(seg.id)}
                aria-pressed={selectedRef === seg.id}
                className={`w-full rounded-[8px] border px-3 py-2.5 text-left transition-colors duration-150 ${
                  on ? 'border-accent bg-accent-soft' : 'border-transparent hover:border-rule hover:bg-paper'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-[11px] font-semibold ${on ? 'text-accent-strong' : 'text-muted'}`}>{seg.id}</span>
                  <span className="font-mono text-[10.5px] text-faint">→ {derived(seg.id)} elemen</span>
                </span>
                <span className={`mt-1 block text-[13.5px] leading-snug ${on ? 'text-ink' : 'text-ink-2'}`}>{seg.text}</span>
                {seg.actor && (
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-muted">
                    <span>{seg.actor}</span>
                    <span>⏱ {seg.waktu}</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

function QuestionsRow({
  questions,
  answers,
  flash,
  onAnswer,
  onUndo,
  onHover,
}: {
  questions: Question[]
  answers: Answers
  flash: string | null
  onAnswer: (qid: string, oid: string) => void
  onUndo: (qid: string) => void
  onHover: (refs: Ref[] | null) => void
}) {
  const open = questions.filter((q) => !answers[q.id]).length
  return (
    <section aria-label="Pertanyaan klarifikasi">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold">
          {open > 0 ? `${open} hal tidak dijelaskan SOP` : 'Semua pertanyaan terjawab'}
        </h2>
        <span className="text-[13px] text-muted">{open > 0 ? 'Model tidak menebak. Jawaban Anda mengubah draf.' : 'Draf siap diekspor ke AlurKerja.'}</span>
      </div>
      <div className={`grid grid-cols-1 gap-3 ${questions.length > 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {questions.map((q, i) => {
          const chosen = answers[q.id]
          const opt = q.options.find((o) => o.id === chosen)
          return (
            <motion.article
              id={`q-${q.id}`}
              key={q.id}
              layout
              onMouseEnter={() => onHover(q.refs)}
              onMouseLeave={() => onHover(null)}
              animate={flash === q.id ? { scale: [1, 1.015, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, ease }}
              className={`flex min-w-0 flex-col rounded-[var(--radius-card)] border p-4 shadow-soft ${
                opt ? 'border-rule bg-ok-soft/60' : flash === q.id ? 'border-warn bg-warn-soft' : 'border-rule bg-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${opt ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn-ink'}`}>
                  P{i + 1}
                </span>
                <span className="font-mono text-[10.5px] text-muted">dari {q.refs.join(', ')}</span>
              </div>
              <p className="mt-2 text-[14.5px] leading-snug font-medium text-ink">{q.text}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{q.why}</p>
              <div className="mt-auto pt-3">
                <AnimatePresence mode="wait" initial={false}>
                  {opt ? (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-ctl)] border border-rule bg-surface px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-[13px] text-ink">
                        <Check size={15} className="shrink-0 text-ok" aria-hidden="true" />
                        <span className="truncate">{opt.label}</span>
                      </span>
                      <button onClick={() => onUndo(q.id)} className="flex shrink-0 items-center gap-1 text-[12.5px] text-muted hover:text-ink">
                        <Undo2 size={13} aria-hidden="true" /> Batalkan
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="opts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-2">
                      {q.options.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => onAnswer(q.id, o.id)}
                          className="group rounded-[var(--radius-ctl)] border border-rule-2 bg-surface px-3 py-2 text-left transition-colors duration-150 hover:border-accent hover:bg-accent-soft"
                        >
                          <span className="block text-[13px] font-medium text-ink group-hover:text-accent-strong">{o.label}</span>
                          <span className="block text-[11.5px] text-muted">{o.hint}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

function DiagramPanel({
  graph,
  layout,
  scenario,
  activeRefs,
  selectedNode,
  onSelectNode,
  onSelectQuestion,
}: {
  graph: Graph
  layout: ReturnType<typeof layoutGraph>
  scenario: Scenario
  activeRefs: Set<Ref>
  selectedNode: string | null
  onSelectNode: (id: string | null) => void
  onSelectQuestion: (qid: string) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0.8)
  const [zoom, setZoom] = useState<number | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setFit(Math.min(1, (el.clientWidth - 8) / layout.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [layout.width])

  const z = zoom ?? Math.max(fit, 0.62)
  const node = selectedNode ? graph.nodes.find((n) => n.id === selectedNode) : undefined
  const lane = node ? graph.lanes.find((l) => l.id === node.lane) : undefined

  return (
    <div>
      <div className="flex items-center justify-end gap-1 border-b border-rule px-3 py-2">
        <button className="rounded-[var(--radius-ctl)] p-1.5 text-muted hover:bg-paper-2 hover:text-ink" onClick={() => setZoom(Math.max(0.5, +(z - 0.1).toFixed(2)))} aria-label="Perkecil">
          <Minus size={15} />
        </button>
        <span className="w-12 text-center font-mono text-[11.5px] text-muted tabular-nums">{Math.round(z * 100)}%</span>
        <button className="rounded-[var(--radius-ctl)] p-1.5 text-muted hover:bg-paper-2 hover:text-ink" onClick={() => setZoom(Math.min(1.4, +(z + 0.1).toFixed(2)))} aria-label="Perbesar">
          <Plus size={15} />
        </button>
        <button className="ml-1 flex items-center gap-1.5 rounded-[var(--radius-ctl)] px-2 py-1.5 text-[12px] text-muted hover:bg-paper-2 hover:text-ink" onClick={() => setZoom(fit)}>
          <Maximize2 size={13} /> Pas layar
        </button>
      </div>
      <div ref={boxRef} className="overflow-auto bg-paper p-1 scroll-thin" style={{ maxHeight: '68vh' }}>
        <Diagram
          graph={graph}
          layout={layout}
          processName={scenario.processName}
          activeRefs={activeRefs}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          onSelectQuestion={onSelectQuestion}
          zoom={z}
        />
      </div>
      <div className="min-h-[64px] border-t border-rule px-4 py-3">
        {node && node.kind !== 'placeholder' ? (
          <div className="flex flex-col gap-1.5 text-[13px] sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-6">
            <span className="font-display text-[15px] font-semibold text-ink">{node.label}</span>
            <span className="text-muted">
              Lane <span className="text-ink-2">{lane?.name}</span> → <span className="text-ink-2">{lane?.role}</span>
            </span>
            <span className="text-muted">
              Sumber:{' '}
              {node.by ? (
                <span className="text-ok">jawaban analis ({node.by.toUpperCase().replace('Q', 'P')})</span>
              ) : (
                node.refs.map((r) => (
                  <span key={r} className="text-ink-2">
                    <span className="font-mono text-accent-strong">{r}</span> “{scenario.segments.find((s) => s.id === r)?.text}”{' '}
                  </span>
                ))
              )}
            </span>
            {node.sla && <span className="text-muted">Waktu baku {node.sla}</span>}
          </div>
        ) : (
          <p className="text-[13px] text-muted">Klik elemen diagram untuk melihat kalimat sumbernya. Kotak kuning menunggu jawaban Anda.</p>
        )}
      </div>
    </div>
  )
}
