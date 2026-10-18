import type { Graph, Lane, NodeKind, PEdge, PNode, Pool } from './types'

// Geometri ini dipakai bersama oleh SVG dan BPMN DI, jadi ubah di satu tempat saja.

export const L = {
  pad: 16,
  poolStrip: 30,
  laneHead: 128,
  colW: 152,
  rowH: 120,
  rowOffset: 8, // ruang untuk jalur loop di atas node
  extPoolH: 54,
  poolGap: 30,
}

const HALF: Record<NodeKind, [number, number]> = {
  task: [66, 31],
  xor: [23, 23],
  start: [17, 17],
  end: [17, 17],
  catch: [17, 17],
  placeholder: [60, 27],
}

export type Pt = [number, number]

export interface NodeBox {
  node: PNode
  cx: number
  cy: number
  hw: number
  hh: number
}

export interface LaneBox {
  lane: Lane
  y: number
  h: number
}

export interface PoolBox {
  pool: Pool
  x: number
  y: number
  w: number
  h: number
}

export interface EdgeGeo {
  edge: PEdge
  pts: Pt[]
  labelAt?: Pt
  labelAnchor: 'start' | 'middle'
}

export interface MsgGeo {
  id: string
  label: string
  pts: Pt[]
  labelAt: Pt
}

export interface Layout {
  width: number
  height: number
  main: { x: number; y: number; w: number; h: number }
  lanes: LaneBox[]
  pools: PoolBox[]
  nodes: Map<string, NodeBox>
  edges: EdgeGeo[]
  msgs: MsgGeo[]
}

export function layoutGraph(g: Graph): Layout {
  const maxCol = Math.max(0, ...g.nodes.map((n) => n.col))
  const x0 = L.pad + L.poolStrip + L.laneHead
  const width = x0 + (maxCol + 1) * L.colW + L.pad
  const top = g.pools.filter((p) => p.position === 'top')
  const bottom = g.pools.filter((p) => p.position === 'bottom')

  let y = L.pad
  const pools: PoolBox[] = []
  for (const pool of top) {
    pools.push({ pool, x: L.pad, y, w: width - 2 * L.pad, h: L.extPoolH })
    y += L.extPoolH + L.poolGap
  }

  const mainY = y
  const lanes: LaneBox[] = g.lanes.map((lane) => {
    const rows = 1 + Math.max(0, ...g.nodes.filter((n) => n.lane === lane.id).map((n) => n.row ?? 0))
    const box = { lane, y, h: rows * L.rowH }
    y += box.h
    return box
  })
  const main = { x: L.pad, y: mainY, w: width - 2 * L.pad, h: y - mainY }

  for (const pool of bottom) {
    y += L.poolGap
    pools.push({ pool, x: L.pad, y, w: width - 2 * L.pad, h: L.extPoolH })
    y += L.extPoolH
  }
  const height = y + L.pad

  const laneOf = new Map(lanes.map((b) => [b.lane.id, b]))
  const nodes = new Map<string, NodeBox>()
  for (const node of g.nodes) {
    const lb = laneOf.get(node.lane)
    if (!lb) continue
    const [hw, hh] = HALF[node.kind]
    nodes.set(node.id, {
      node,
      cx: x0 + node.col * L.colW + L.colW / 2,
      cy: lb.y + (node.row ?? 0) * L.rowH + L.rowH / 2 + L.rowOffset,
      hw,
      hh,
    })
  }

  const edges: EdgeGeo[] = []
  for (const edge of g.edges) {
    const a = nodes.get(edge.from)
    const b = nodes.get(edge.to)
    if (!a || !b) continue
    edges.push(edgeGeo(edge, a, b, laneOf))
  }

  const poolOf = new Map(pools.map((p) => [p.pool.id, p]))
  const msgs: MsgGeo[] = []
  for (const m of g.msgs) {
    const fromPool = poolOf.get(m.from)
    const toPool = poolOf.get(m.to)
    const nb = nodes.get(fromPool ? m.to : m.from)
    const pb = fromPool ?? toPool
    if (!nb || !pb) continue
    const poolEdgeY = pb.pool.position === 'top' ? pb.y + pb.h : pb.y
    const nodeEdgeY = pb.pool.position === 'top' ? nb.cy - nb.hh : nb.cy + nb.hh
    const pts: Pt[] = fromPool
      ? [
          [nb.cx, poolEdgeY],
          [nb.cx, nodeEdgeY],
        ]
      : [
          [nb.cx, nodeEdgeY],
          [nb.cx, poolEdgeY],
        ]
    const midY = pb.pool.position === 'top' ? poolEdgeY + 16 : poolEdgeY - 10
    msgs.push({ id: m.id, label: m.label, pts, labelAt: [nb.cx + 8, midY] })
  }

  return { width, height, main, lanes, pools, nodes, edges, msgs }
}

function edgeGeo(edge: PEdge, a: NodeBox, b: NodeBox, laneOf: Map<string, LaneBox>): EdgeGeo {
  const la = laneOf.get(a.node.lane)!
  const lb = laneOf.get(b.node.lane)!

  if (edge.route === 'above') {
    const railY = Math.min(la.y, lb.y) + 9
    return {
      edge,
      pts: [
        [a.cx, a.cy - a.hh],
        [a.cx, railY],
        [b.cx, railY],
        [b.cx, b.cy - b.hh],
      ],
      labelAt: [(a.cx + b.cx) / 2, railY - 4],
      labelAnchor: 'middle',
    }
  }
  if (edge.route === 'below') {
    const railY = Math.max(la.y + la.h, lb.y + lb.h) - 11
    return {
      edge,
      pts: [
        [a.cx, a.cy + a.hh],
        [a.cx, railY],
        [b.cx, railY],
        [b.cx, b.cy + b.hh],
      ],
      labelAt: [(a.cx + b.cx) / 2, railY - 4],
      labelAnchor: 'middle',
    }
  }
  if (Math.abs(a.cy - b.cy) < 1) {
    return {
      edge,
      pts: [
        [a.cx + a.hw, a.cy],
        [b.cx - b.hw, b.cy],
      ],
      labelAt: [a.cx + a.hw + 8, a.cy - 7],
      labelAnchor: 'start',
    }
  }
  if (a.node.kind === 'xor' && !edge.elbow) {
    const down = b.cy > a.cy
    const exitY = down ? a.cy + a.hh : a.cy - a.hh
    return {
      edge,
      pts: [
        [a.cx, exitY],
        [a.cx, b.cy],
        [b.cx - b.hw, b.cy],
      ],
      labelAt: [a.cx + 8, down ? exitY + 15 : exitY - 7],
      labelAnchor: 'start',
    }
  }
  const midX = (a.cx + a.hw + (b.cx - b.hw)) / 2
  return {
    edge,
    pts: [
      [a.cx + a.hw, a.cy],
      [midX, a.cy],
      [midX, b.cy],
      [b.cx - b.hw, b.cy],
    ],
    labelAt: [a.cx + a.hw + 8, a.cy - 7],
    labelAnchor: 'start',
  }
}

export function roundedPath(pts: Pt[], r = 8): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]
    const d1 = Math.hypot(x - px, y - py)
    const d2 = Math.hypot(nx - x, ny - y)
    const rr = Math.min(r, d1 / 2, d2 / 2)
    const ax = x - ((x - px) / d1) * rr
    const ay = y - ((y - py) / d1) * rr
    const bx = x + ((nx - x) / d2) * rr
    const by = y + ((ny - y) / d2) * rr
    d += ` L ${ax} ${ay} Q ${x} ${y} ${bx} ${by}`
  }
  const last = pts[pts.length - 1]
  return `${d} L ${last[0]} ${last[1]}`
}
