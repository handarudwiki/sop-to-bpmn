import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { L, roundedPath, type Layout, type NodeBox } from '../lib/layout'
import type { Graph, Ref } from '../lib/types'

interface Props {
  graph: Graph
  layout: Layout
  processName: string
  activeRefs: Set<Ref>
  selectedNode: string | null
  onSelectNode: (id: string | null) => void
  onSelectQuestion?: (qid: string) => void
  zoom: number
}

const ease = [0.16, 1, 0.3, 1] as const
type Side = 'above' | 'below' | 'left'

function wrap(text: string, max = 18): string[] {
  const lines: string[] = []
  let cur = ''
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  return lines
}

export default function Diagram({ graph, layout, processName, activeRefs, selectedNode, onSelectNode, onSelectQuestion, zoom }: Props) {
  const highlighting = activeRefs.size > 0 || selectedNode !== null
  const isLit = (refs: Ref[] = [], id?: string) => (id && id === selectedNode) || refs.some((r) => activeRefs.has(r))

  const labelSide = useMemo(() => {
    const side = new Map<string, Side>()
    for (const nb of layout.nodes.values()) {
      const id = nb.node.id
      const touches = (cond: (y: number) => boolean) =>
        layout.edges.some((e) => (e.edge.from === id && cond(e.pts[0][1])) || (e.edge.to === id && cond(e.pts[e.pts.length - 1][1])))
      const bottom = touches((y) => y > nb.cy + 1)
      const top = touches((y) => y < nb.cy - 1)
      side.set(id, !bottom ? 'below' : !top ? 'above' : 'left')
    }
    return side
  }, [layout])

  const x0 = L.pad + L.poolStrip

  return (
    <svg
      width={layout.width * zoom}
      height={layout.height * zoom}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="block select-none"
      role="img"
      aria-label={`Diagram BPMN ${processName}`}
      onClick={() => onSelectNode(null)}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-ink-2" />
        </marker>
        <marker id="arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-accent" />
        </marker>
        <marker id="arrow-warn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-warn" />
        </marker>
        <marker id="msg-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9 z" className="fill-surface stroke-muted" strokeWidth="1.2" />
        </marker>
        <marker id="msg-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7">
          <circle cx="5" cy="5" r="3.6" className="fill-surface stroke-muted" strokeWidth="1.2" />
        </marker>
      </defs>

      {layout.pools.map((pb) => (
        <g key={pb.pool.id}>
          <rect x={pb.x} y={pb.y} width={pb.w} height={pb.h} rx={8} className="fill-paper-2 stroke-rule-2" strokeWidth={1} />
          <text x={pb.x + pb.w / 2} y={pb.y + pb.h / 2 + 5} textAnchor="middle" className="fill-ink font-display text-[14px] font-semibold">
            {pb.pool.name}
            <tspan className="fill-muted font-mono text-[10.5px] font-normal" dx={10}>
              PIHAK EKSTERNAL
            </tspan>
          </text>
        </g>
      ))}

      <rect x={layout.main.x} y={layout.main.y} width={layout.main.w} height={layout.main.h} rx={8} className="fill-surface stroke-rule-2" strokeWidth={1} />
      <text
        transform={`translate(${layout.main.x + L.poolStrip / 2 + 4} ${layout.main.y + layout.main.h / 2}) rotate(-90)`}
        textAnchor="middle"
        className="fill-ink-2 font-mono text-[10.5px] uppercase tracking-[0.06em]"
      >
        {processName}
      </text>
      <line x1={x0} y1={layout.main.y} x2={x0} y2={layout.main.y + layout.main.h} className="stroke-rule-2" />
      <AnimatePresence initial={false}>
        {layout.lanes.map((lb, i) => {
          const low = lb.lane.score < 0.8
          return (
            <motion.g key={lb.lane.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }}>
              {lb.lane.by && <rect x={x0} y={lb.y} width={layout.main.x + layout.main.w - x0} height={lb.h} className="fill-accent-soft" opacity={0.45} />}
              {i > 0 && <line x1={x0} y1={lb.y} x2={layout.main.x + layout.main.w} y2={lb.y} className="stroke-rule-2" />}
              <line x1={x0 + L.laneHead} y1={lb.y} x2={x0 + L.laneHead} y2={lb.y + lb.h} className="stroke-rule" />
              <text x={x0 + 14} y={lb.y + 30} className="fill-ink font-display text-[14px] font-semibold">
                {lb.lane.name}
              </text>
              <text x={x0 + 14} y={lb.y + 48} className="fill-muted font-mono text-[10px]">
                → {lb.lane.role.length > 19 ? lb.lane.role.slice(0, 18) + '…' : lb.lane.role}
              </text>
              <g transform={`translate(${x0 + 14} ${lb.y + 58})`}>
                <rect width={low ? 70 : 54} height={17} rx={4} className={low ? 'fill-warn-soft' : lb.lane.by ? 'fill-ok-soft' : 'fill-accent-soft'} />
                <text x={6} y={12} className={`font-mono text-[9.5px] ${low ? 'fill-warn-ink' : lb.lane.by ? 'fill-ok' : 'fill-accent-strong'}`}>
                  {lb.lane.by ? 'DARI P3' : low ? `${Math.round(lb.lane.score * 100)}% · CEK` : `${Math.round(lb.lane.score * 100)}% COCOK`}
                </text>
              </g>
            </motion.g>
          )
        })}
      </AnimatePresence>

      <AnimatePresence>
        {layout.edges.map((eg) => {
          const toPh = graph.nodes.find((n) => n.id === eg.edge.to)?.kind === 'placeholder'
          const lit = isLit(eg.edge.refs, undefined) || eg.edge.from === selectedNode || eg.edge.to === selectedNode
          const dim = highlighting && !lit
          const isNew = !!eg.edge.by
          const d = roundedPath(eg.pts)
          return (
            <motion.g key={eg.edge.id + d} initial={{ opacity: 0 }} animate={{ opacity: dim ? 0.22 : 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <motion.path
                d={d}
                fill="none"
                className={toPh ? 'stroke-warn' : isNew || lit ? 'stroke-accent' : 'stroke-ink-2'}
                strokeWidth={lit ? 1.8 : 1.3}
                strokeDasharray={toPh ? '5 4' : undefined}
                markerEnd={toPh ? 'url(#arrow-warn)' : isNew || lit ? 'url(#arrow-accent)' : 'url(#arrow)'}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease, delay: isNew ? 0.15 : 0 }}
              />
              {eg.edge.label && eg.labelAt && (
                <text
                  x={eg.labelAt[0]}
                  y={eg.labelAt[1]}
                  textAnchor={eg.labelAnchor}
                  className="fill-ink-2 stroke-surface font-mono text-[10.5px] font-medium [paint-order:stroke]"
                  strokeWidth={4}
                >
                  {eg.edge.label}
                </text>
              )}
            </motion.g>
          )
        })}
      </AnimatePresence>

      {layout.msgs.map((mg) => (
        <g key={mg.id} opacity={highlighting ? 0.25 : 1}>
          <path d={roundedPath(mg.pts)} fill="none" className="stroke-muted" strokeWidth={1.1} strokeDasharray="5 4" markerStart="url(#msg-start)" markerEnd="url(#msg-end)" />
          <text x={mg.labelAt[0]} y={mg.labelAt[1]} className="fill-muted stroke-surface font-mono text-[10px] [paint-order:stroke]" strokeWidth={4}>
            {mg.label}
          </text>
        </g>
      ))}

      <AnimatePresence>
        {[...layout.nodes.values()].map((nb, i) => (
          <NodeShape
            key={nb.node.id}
            nb={nb}
            index={i}
            lit={isLit(nb.node.refs, nb.node.id)}
            dim={highlighting && !isLit(nb.node.refs, nb.node.id)}
            selected={selectedNode === nb.node.id}
            side={labelSide.get(nb.node.id) ?? 'below'}
            onClick={() => {
              if (nb.node.kind === 'placeholder' && nb.node.question) onSelectQuestion?.(nb.node.question)
              onSelectNode(nb.node.id)
            }}
          />
        ))}
      </AnimatePresence>
    </svg>
  )
}

function RefChips({ refs, by, x, y, alignEnd }: { refs: Ref[]; by?: string; x: number; y: number; alignEnd?: boolean }) {
  const items = by ? [`${by.toUpperCase().replace('Q', 'P')} ✓`] : refs
  const total = items.reduce((w, r) => w + r.length * 6.6 + 13, -3)
  let cx = alignEnd ? x - total : x
  return (
    <g>
      {items.map((r) => {
        const w = r.length * 6.6 + 10
        const el = (
          <g key={r} transform={`translate(${cx} ${y})`}>
            <rect width={w} height={15} rx={3.5} className={by ? 'fill-ok-soft' : 'fill-accent-soft'} />
            <text x={5} y={11} className={`font-mono text-[9.5px] font-semibold ${by ? 'fill-ok' : 'fill-accent-strong'}`}>
              {r}
            </text>
          </g>
        )
        cx += w + 3
        return el
      })}
    </g>
  )
}

function NodeShape({
  nb,
  index,
  lit,
  dim,
  selected,
  side,
  onClick,
}: {
  nb: NodeBox
  index: number
  lit: boolean
  dim: boolean
  selected: boolean
  side: Side
  onClick: () => void
}) {
  const n = nb.node
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])
  const stroke = lit || selected ? 'stroke-accent' : 'stroke-ink-2'
  const sw = lit || selected ? 2 : 1.3
  const isNew = !!n.by

  let body: React.ReactNode
  if (n.kind === 'task') {
    const lines = wrap(n.label)
    body = (
      <>
        <rect
          x={-nb.hw}
          y={-nb.hh}
          width={nb.hw * 2}
          height={nb.hh * 2}
          rx={9}
          className={`${lit || selected ? 'fill-accent-soft' : 'fill-surface'} ${stroke}`}
          strokeWidth={sw}
        />
        <text textAnchor="middle" className="fill-ink text-[12.5px] font-medium">
          {lines.map((l, i) => (
            <tspan key={i} x={0} y={(i - (lines.length - 1) / 2) * 15 + 4.5}>
              {l}
            </tspan>
          ))}
        </text>
        <RefChips refs={n.refs} by={n.by} x={-nb.hw + 2} y={-nb.hh - 18} />
        {n.sla && (
          <text x={nb.hw - 2} y={nb.hh + 14} textAnchor="end" className="fill-muted font-mono text-[9.5px]">
            ⏱ {n.sla}
          </text>
        )}
        {n.form?.length ? (
          <text x={-nb.hw + 2} y={nb.hh + 14} className="fill-muted font-mono text-[9.5px]">
            ▤ {n.form.length} field
          </text>
        ) : null}
      </>
    )
  } else if (n.kind === 'xor') {
    const lx = side === 'left' ? -8 : 0
    const ly = side === 'below' ? nb.hh + 16 : side === 'above' ? -nb.hh - 9 : -nb.hh - 11
    body = (
      <>
        <rect
          x={-16}
          y={-16}
          width={32}
          height={32}
          rx={3}
          transform="rotate(45)"
          className={`${lit || selected ? 'fill-accent-soft' : 'fill-surface'} ${stroke}`}
          strokeWidth={sw}
        />
        <path d="M -7 -7 L 7 7 M 7 -7 L -7 7" className={stroke} strokeWidth={2.2} strokeLinecap="round" />
        <text x={lx} y={ly} textAnchor={side === 'left' ? 'end' : 'middle'} className="fill-ink stroke-surface text-[12px] font-semibold [paint-order:stroke]" strokeWidth={4}>
          {n.label}
        </text>
        {side === 'left' ? (
          <RefChips refs={n.refs} by={n.by} x={nb.hw + 4} y={nb.hh - 11} />
        ) : (
          <RefChips refs={n.refs} by={n.by} x={-nb.hw - 6} y={-nb.hh - 6} alignEnd />
        )}
      </>
    )
  } else if (n.kind === 'placeholder') {
    body = (
      <>
        <motion.rect
          x={-nb.hw - 5}
          y={-nb.hh - 5}
          width={nb.hw * 2 + 10}
          height={nb.hh * 2 + 10}
          rx={12}
          fill="none"
          className="stroke-warn"
          strokeWidth={1}
          animate={{ opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <rect x={-nb.hw} y={-nb.hh} width={nb.hw * 2} height={nb.hh * 2} rx={9} className="fill-warn-soft stroke-warn" strokeWidth={1.4} strokeDasharray="5 4" />
        <text x={-nb.hw + 12} y={6} className="fill-warn-ink font-display text-[18px] font-bold">
          ?
        </text>
        <text x={-nb.hw + 30} y={1} className="fill-warn-ink text-[12px] font-semibold">
          {n.label}
        </text>
        <text x={-nb.hw + 30} y={15} className="fill-warn-ink font-mono text-[9.5px]">
          {(n.question ?? '').toUpperCase().replace('Q', 'PERTANYAAN P')}
        </text>
      </>
    )
  } else {
    const ly = side === 'below' ? nb.hh + 16 : -nb.hh - 9
    if (side === 'left') side = 'above'
    const lines = wrap(n.label, 16)
    body = (
      <>
        <circle r={17} className={`${lit || selected ? 'fill-accent-soft' : 'fill-surface'} ${n.kind === 'end' ? 'stroke-ink' : stroke}`} strokeWidth={n.kind === 'end' ? 3.4 : sw} />
        {n.kind === 'catch' && <circle r={13} fill="none" className={stroke} strokeWidth={1.2} />}
        {(n.kind === 'catch' || n.kind === 'start') && (
          <g className={stroke} strokeWidth={1.2} fill="none">
            <rect x={-7} y={-5} width={14} height={10} rx={1} />
            <path d="M -7 -5 L 0 1 L 7 -5" />
          </g>
        )}
        <text textAnchor="middle" className="fill-ink-2 stroke-surface text-[11px] font-medium [paint-order:stroke]" strokeWidth={4}>
          {lines.map((l, i) => (
            <tspan key={i} x={0} y={side === 'below' ? ly + i * 13 : ly - (lines.length - 1 - i) * 13}>
              {l}
            </tspan>
          ))}
        </text>
        <RefChips refs={n.refs} by={n.by} x={nb.hw + 4} y={side === 'below' ? -nb.hh - 4 : nb.hh - 11} />
      </>
    )
  }

  return (
    <motion.g
      initial={{ opacity: 0, x: nb.cx, y: nb.cy + 8, scale: 0.92 }}
      animate={{ opacity: dim ? 0.28 : 1, x: nb.cx, y: nb.cy, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: mounted.current ? 0.3 : 0.5, ease, delay: mounted.current ? 0 : isNew ? 0.1 : Math.min(index * 0.04, 0.5) }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="cursor-pointer"
      role="button"
      aria-label={n.label}
    >
      {isNew && (
        <motion.circle
          r={46}
          className="fill-accent"
          initial={{ opacity: 0.25, scale: 0.4 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 1.1, ease }}
        />
      )}
      {body}
    </motion.g>
  )
}
