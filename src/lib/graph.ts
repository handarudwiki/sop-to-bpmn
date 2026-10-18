import type { Graph, Patch, Scenario } from './types'

export type Answers = Record<string, string> // questionId -> optionId

function applyPatch(g: Graph, p: Patch): Graph {
  const removeN = new Set(p.removeNodes ?? [])
  const removeE = new Set(p.removeEdges ?? [])
  let nodes = g.nodes.filter((n) => !removeN.has(n.id)).concat(p.addNodes ?? [])
  if (p.setRequired) {
    nodes = nodes.map((n) => {
      const sets = p.setRequired!.filter((s) => s.node === n.id)
      if (!sets.length || !n.form) return n
      return {
        ...n,
        form: n.form.map((f) => {
          const s = sets.find((x) => x.field === f.name)
          return s ? { ...f, required: s.required } : f
        }),
      }
    })
  }
  return {
    pools: g.pools,
    lanes: g.lanes.concat(p.addLanes ?? []),
    nodes,
    edges: g.edges.filter((e) => !removeE.has(e.id)).concat(p.addEdges ?? []),
    msgs: g.msgs.concat(p.addMsgs ?? []),
  }
}

export function buildGraph(s: Scenario, answers: Answers): Graph {
  return s.questions.reduce((g, q) => {
    const opt = q.options.find((o) => o.id === answers[q.id])
    return opt ? applyPatch(g, opt.patch) : g
  }, s.graph)
}

export function graphStats(g: Graph) {
  const flow = g.nodes.filter((n) => n.kind !== 'placeholder')
  const traced = flow.filter((n) => n.refs.length > 0 || n.by).length
  return {
    tasks: g.nodes.filter((n) => n.kind === 'task').length,
    gateways: g.nodes.filter((n) => n.kind === 'xor').length,
    actors: g.lanes.length + g.pools.length,
    open: g.nodes.filter((n) => n.kind === 'placeholder').length,
    tracedPct: flow.length ? Math.round((traced / flow.length) * 100) : 100,
    fields: g.nodes.reduce((sum, n) => sum + (n.form?.length ?? 0), 0),
  }
}
