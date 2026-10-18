import { motion, useScroll, useTransform } from 'motion/react'
import { CheckCircle2, Download } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Diagram from './Diagram'
import { scenarios } from '../data/scenarios'
import { layoutGraph } from '../lib/layout'

const s = scenarios[0]
const layout = layoutGraph(s.graph)
const noop = () => {}

export default function HeroShowcase() {
  const wrap = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(3)
  const [zoom, setZoom] = useState(0.6)

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start end', 'start 0.35'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [16, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1])

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % s.segments.length), 2600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setZoom(Math.max(0.56, Math.min(0.78, el.clientWidth / layout.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const seg = s.segments[i]
  const active = useMemo(() => new Set([seg.id]), [seg.id])
  const derived = s.graph.nodes.filter((n) => n.refs.includes(seg.id))

  return (
    <div ref={wrap} className="relative mx-auto max-w-[1180px] [perspective:1800px]">
      <motion.div style={{ rotateX, scale, transformOrigin: 'center top' }} className="relative">
        <div className="overflow-hidden rounded-[22px] border border-rule bg-surface shadow-float">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold text-ink">Pengajuan Kredit</span>
              <span className="mono-label hidden rounded-full bg-paper-2 px-2.5 py-1 text-muted sm:inline">prosa · bank</span>
            </div>
            <div className="hidden items-center gap-1 rounded-full bg-paper-2 p-1 text-[12.5px] md:flex">
              {['Diagram', 'Form', 'Jabatan', 'BPMN XML'].map((t, k) => (
                <span key={t} className={`rounded-full px-3 py-1 ${k === 0 ? 'bg-ink text-accent-ink' : 'text-muted'}`}>
                  {t}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-accent-ink">
              <Download size={13} aria-hidden="true" /> .bpmn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)]">
            <ol className="hidden space-y-1 border-r border-rule bg-paper p-3 md:block">
              {s.segments.map((x, k) => (
                <li
                  key={x.id}
                  className={`rounded-[10px] border px-3 py-2 transition-colors duration-300 ${
                    k === i ? 'border-accent-line bg-accent-soft' : 'border-transparent'
                  }`}
                >
                  <span className={`font-mono text-[10.5px] font-semibold ${k === i ? 'text-accent-strong' : 'text-faint'}`}>{x.id}</span>
                  <span className={`mt-0.5 block text-[12px] leading-snug ${k === i ? 'text-ink' : 'text-muted'}`}>{x.text}</span>
                </li>
              ))}
            </ol>
            <div
              ref={box}
              className="relative overflow-hidden bg-paper [mask-image:linear-gradient(to_right,black_82%,transparent)]"
              aria-hidden="true"
            >
              <Diagram
                graph={s.graph}
                layout={layout}
                processName={s.processName}
                activeRefs={active}
                selectedNode={null}
                onSelectNode={noop}
                zoom={zoom}
              />
            </div>
          </div>
        </div>

        <div className="float-slow pointer-events-none absolute right-6 -bottom-7 hidden rounded-[14px] border border-rule bg-surface/95 px-4 py-3 shadow-lift backdrop-blur-md sm:block md:right-16">
          <p className="mono-label text-muted">jejak sumber</p>
          <p className="mt-1 text-[13px] text-ink">
            <span className="font-mono font-semibold text-accent-strong">{seg.id}</span> → {derived.length} elemen BPMN
          </p>
        </div>

        <div className="float-slower absolute top-[34%] -right-6 hidden w-[270px] rounded-[16px] border border-rule bg-surface/95 p-4 shadow-float backdrop-blur-md lg:block">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-warn-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold text-warn-ink">P3</span>
            <span className="font-mono text-[10.5px] text-muted">dari S5</span>
          </div>
          <p className="mt-2 text-[13.5px] leading-snug font-medium text-ink">Siapa yang memberikan persetujuan kredit?</p>
          <p className="mt-1 text-[12px] leading-snug text-muted">SOP tidak menyebut penyetujunya. FlowForge bertanya, bukan menebak.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <span className="rounded-[10px] border border-accent bg-accent-soft px-2.5 py-1.5 text-center font-medium text-accent-strong">Kepala Cabang</span>
            <span className="rounded-[10px] border border-rule-2 px-2.5 py-1.5 text-center text-ink-2">Komite Kredit</span>
          </div>
        </div>

        <div className="float-slower absolute -bottom-5 left-6 hidden items-center gap-2 rounded-full border border-rule bg-surface/95 px-4 py-2 text-[12.5px] text-ink shadow-lift backdrop-blur-md md:left-[22%] md:flex">
          <CheckCircle2 size={15} className="text-ok" aria-hidden="true" />
          BPMN 2.0 · lolos validasi bpmn-moddle
        </div>
      </motion.div>
    </div>
  )
}
