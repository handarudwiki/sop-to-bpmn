export type Ref = string

export type FieldType =
  | 'INPUT_TEXT'
  | 'INPUT_TEXTAREA'
  | 'INPUT_NUMBER'
  | 'INPUT_DATE'
  | 'INPUT_SELECT'
  | 'INPUT_FILE_UPLOAD'

export interface FormField {
  name: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
  refs: Ref[]
}

export type NodeKind = 'start' | 'end' | 'task' | 'xor' | 'catch' | 'placeholder'

export interface PNode {
  id: string
  kind: NodeKind
  label: string
  lane: string
  col: number
  row?: number
  refs: Ref[]
  by?: string // id pertanyaan yang membuat elemen ini
  sla?: string
  form?: FormField[]
  question?: string
}

export interface Condition {
  field: string
  op: '==' | '!='
  value: string
}

export interface PEdge {
  id: string
  from: string
  to: string
  label?: string
  cond?: Condition
  route?: 'above' | 'below'
  elbow?: boolean // siku di tengah kolom, bukan keluar dari atas/bawah gateway
  refs?: Ref[]
  by?: string
}

export interface MsgFlow {
  id: string
  from: string // node id atau pool id
  to: string
  label: string
}

export interface Lane {
  id: string
  name: string // nama aktor di SOP
  role: string // jabatan di Struktur Organisasi hasil pemetaan
  score: number
  reason: string
  refs: Ref[]
  by?: string
}

export interface Pool {
  id: string
  name: string
  refs: Ref[]
  position: 'top' | 'bottom'
}

export interface Patch {
  removeNodes?: string[]
  removeEdges?: string[]
  addLanes?: Lane[]
  addNodes?: PNode[]
  addEdges?: PEdge[]
  addMsgs?: MsgFlow[]
  setRequired?: { node: string; field: string; required: boolean }[]
}

export interface Option {
  id: string
  label: string
  hint: string
  patch: Patch
}

export interface Question {
  id: string
  about: string
  refs: Ref[]
  text: string
  why: string
  options: Option[]
}

export interface Segment {
  id: Ref
  text: string
  actor?: string
  kelengkapan?: string
  waktu?: string
  output?: string
}

export interface Graph {
  lanes: Lane[]
  pools: Pool[]
  nodes: PNode[]
  edges: PEdge[]
  msgs: MsgFlow[]
}

export interface Scenario {
  id: string
  title: string
  processName: string
  fileName: string
  kind: 'prosa' | 'sop-ap'
  kindLabel: string
  summary: string
  identity?: { label: string; value: string }[]
  segments: Segment[]
  orgRoles: string[]
  graph: Graph
  questions: Question[]
  log: { stage: string; detail: string }[]
}
