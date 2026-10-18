import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { scenarios } from '../data/scenarios'

const S = scenarios[0].segments
const NODES: { label: string; kind: 'event' | 'task' | 'xor'; lane: string }[] = [
  { label: 'Pengajuan Kredit Masuk', kind: 'event', lane: 'Petugas' },
  { label: 'Terima Pengajuan Kredit', kind: 'task', lane: 'Petugas' },
  { label: 'Periksa Kelengkapan Dokumen', kind: 'task', lane: 'Petugas' },
  { label: 'Dokumen Lengkap?', kind: 'xor', lane: 'Petugas' },
  { label: 'Kembalikan ke Nasabah', kind: 'task', lane: 'Petugas' },
  { label: 'Lakukan Penilaian Kredit', kind: 'task', lane: 'Analis' },
  { label: 'Memenuhi Syarat?', kind: 'xor', lane: 'Analis' },
  { label: 'Teruskan untuk Persetujuan', kind: 'task', lane: 'Analis' },
]
const MAP: number[][] = [[0, 1], [2], [3, 4], [3, 5], [6, 7]]

const LW = 292
const RX = 362
const RW = 252
const SH = 54
const SG = 12
const NH = 34
const NG = 9.5
const W = RX + RW
const H = Math.max(S.length * (SH + SG), NODES.length * (NH + NG)) + 8

function wrap(t: string, max = 40) {
  const out: string[] = []
  let cur = ''
  for (const w of t.split(' ')) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      out.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) out.push(cur)
  return out
}

export default function TraceHero({ bare = false }: { bare?: boolean }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive((a) => (a + 1) % S.length), 2400)
    return () => clearInterval(t)
  }, [paused])

  const sy = (i: number) => 4 + i * (SH + SG) + SH / 2
  const ny = (i: number) => 4 + i * (NH + NG) + NH / 2
  const lit = new Set(MAP[active])

  return (
    <figure
      className={bare ? '' : 'card p-4 sm:p-6'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="mono-label text-muted">sop-pengajuan-kredit.docx</span>
        <span className="mono-label text-accent-strong">jejak sumber</span>
      </div>
      <div className="overflow-x-auto scroll-thin">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-[480px]" role="img" aria-label="Kalimat SOP terhubung ke elemen BPMN">
          {MAP.map((targets, si) =>
            targets.map((ni) => {
              const on = si === active
              const x1 = LW
              const y1 = sy(si)
              const x2 = RX
              const y2 = ny(ni)
              const d = `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`
              return (
                <motion.path
                  key={`${si}-${ni}`}
                  d={d}
                  fill="none"
                  className={on ? 'stroke-accent' : 'stroke-rule-2'}
                  strokeWidth={on ? 1.8 : 1}
                  animate={{ opacity: on ? 1 : 0.55 }}
                  transition={{ duration: 0.3 }}
                />
              )
            }),
          )}

          {S.map((seg, i) => {
            const on = i === active
            const lines = wrap(seg.text)
            const y = 4 + i * (SH + SG)
            return (
              <g key={seg.id} onClick={() => setActive(i)} className="cursor-pointer">
                <rect x={0} y={y} width={LW} height={SH} rx={8} className={on ? 'fill-accent-soft stroke-accent' : 'fill-paper stroke-rule'} strokeWidth={1} />
                <text x={12} y={y + 19} className={`font-mono text-[10px] font-semibold ${on ? 'fill-accent-strong' : 'fill-muted'}`}>
                  {seg.id}
                </text>
                <text className={`text-[11.5px] ${on ? 'fill-ink' : 'fill-ink-2'}`}>
                  {lines.map((l, k) => (
                    <tspan key={k} x={38} y={y + 21 + k * 15}>
                      {l}
                    </tspan>
                  ))}
                </text>
              </g>
            )
          })}

          {NODES.map((n, i) => {
            const on = lit.has(i)
            const y = 4 + i * (NH + NG)
            const cy = y + NH / 2
            return (
              <g key={n.label}>
                {n.kind === 'task' && (
                  <rect x={RX} y={y} width={RW - 66} height={NH} rx={7} className={on ? 'fill-accent-soft stroke-accent' : 'fill-surface stroke-ink-2'} strokeWidth={on ? 1.6 : 1} />
                )}
                {n.kind === 'xor' && (
                  <rect
                    x={RX + 4}
                    y={cy - 10}
                    width={20}
                    height={20}
                    rx={2}
                    transform={`rotate(45 ${RX + 14} ${cy})`}
                    className={on ? 'fill-accent-soft stroke-accent' : 'fill-surface stroke-ink-2'}
                    strokeWidth={on ? 1.6 : 1}
                  />
                )}
                {n.kind === 'event' && <circle cx={RX + 14} cy={cy} r={11} className={on ? 'fill-accent-soft stroke-accent' : 'fill-surface stroke-ink-2'} strokeWidth={on ? 1.6 : 1} />}
                <text x={n.kind === 'task' ? RX + 10 : RX + 34} y={cy + 4} className={`text-[11px] font-medium ${on ? 'fill-ink' : 'fill-ink-2'}`}>
                  {n.label}
                </text>
                <text x={RX + RW} y={cy + 4} textAnchor="end" className={`font-mono text-[9.5px] ${on ? 'fill-accent-strong' : 'fill-faint'}`}>
                  {n.lane}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule pt-3 text-[13px] text-muted">
        <span className="font-mono text-accent-strong">{S[active].id}</span>
        <span>
          menghasilkan {MAP[active].length} elemen: {MAP[active].map((i) => NODES[i].label).join(' · ')}
        </span>
      </figcaption>
    </figure>
  )
}
