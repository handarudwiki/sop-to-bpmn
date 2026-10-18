import type { FormField, Graph, PNode, Scenario } from './types'
import { layoutGraph } from './layout'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// alurkerja:form wajib memakai &#34; (bukan &quot;) agar bisa di-deploy.
const encForm = (v: unknown) =>
  JSON.stringify(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&#34;')

function fieldJson(f: FormField) {
  const base = {
    label: { en: f.label, id: f.label },
    name: f.name,
    tooltip: { enable: false, message: '' },
    disabled: false,
    constraints: { required: f.required },
  }
  if (f.type === 'INPUT_FILE_UPLOAD') {
    return { ...base, ui_type: 'INPUT_FILE_UPLOAD', multiple_file: false, max_file_size: '10', extensions: 'pdf' }
  }
  if (f.type === 'INPUT_SELECT') {
    return {
      ...base,
      form_field_type: 'INPUT_SELECT',
      ui_type: 'INPUT',
      placeholder: 'Select...',
      defaultValue: null,
      select_searchable: false,
      multiple: false,
      select_options: {
        url: '',
        method: '',
        option_key: 'key',
        option_label: 'label',
        options: (f.options ?? []).map((o) => ({ key: o, label: o[0].toUpperCase() + o.slice(1) })),
      },
    }
  }
  return { ...base, form_field_type: f.type, ui_type: 'INPUT', placeholder: '', defaultValue: null }
}

function formAttr(n: PNode) {
  if (!n.form?.length) return ''
  const form = [
    {
      ui_type: 'MAIN_DIV',
      className: '!p-2',
      element_actions: { delete: false },
      children: [
        {
          title: n.label,
          description: '',
          ui_type: 'FORM_MAIN',
          className: 'w-full',
          element_actions: { delete: false },
          children: [
            { ui_type: 'DIV', className: 'flex flex-col', element_actions: { delete: false }, children: n.form.map(fieldJson) },
          ],
        },
      ],
    },
  ]
  return ` alurkerja:form="${encForm(form)}"`
}

function docOf(n: PNode, s: Scenario) {
  if (n.by) return `Sumber: jawaban analis (${n.by.toUpperCase().replace('Q', 'P')})`
  const quotes = n.refs.map((r) => {
    const seg = s.segments.find((x) => x.id === r)
    return `${r} "${seg?.text ?? ''}"`
  })
  return `Sumber: ${quotes.join(' · ')}${n.sla ? ` · Waktu baku: ${n.sla}` : ''}`
}

export function toBpmnXml(s: Scenario, g: Graph): string {
  const lay = layoutGraph(g)
  const pid = `Process_${s.id.replace(/[^a-z0-9]/gi, '_')}`
  const flowNodes = g.nodes.filter((n) => n.kind !== 'placeholder')
  const placeholders = g.nodes.filter((n) => n.kind === 'placeholder')
  const realIds = new Set(flowNodes.map((n) => n.id))
  const flows = g.edges.filter((e) => realIds.has(e.from) && realIds.has(e.to))
  const pending = g.edges.filter((e) => realIds.has(e.from) && !realIds.has(e.to))
  const io = (id: string) =>
    flows.filter((f) => f.to === id).map((f) => `      <bpmn:incoming>${f.id}</bpmn:incoming>`).concat(
      flows.filter((f) => f.from === id).map((f) => `      <bpmn:outgoing>${f.id}</bpmn:outgoing>`),
    )

  const out: string[] = []
  out.push('<?xml version="1.0" encoding="UTF-8"?>')
  out.push(
    `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:alurkerja="http://alurkerja.id/schema/bpmn" xmlns:userAssignment="https://alurkerja.com/userAssignment" id="Definitions_${s.id}" targetNamespace="http://bpmn.io/schema/bpmn" exporter="FlowForge" exporterVersion="0.1-prototype">`,
  )

  out.push('  <bpmn:collaboration id="Collaboration_1">')
  out.push(`    <bpmn:participant id="Participant_main" name="${esc(s.processName)}" processRef="${pid}" />`)
  for (const p of g.pools) out.push(`    <bpmn:participant id="${p.id}" name="${esc(p.name)}" />`)
  for (const m of g.msgs) {
    if ((realIds.has(m.from) || m.from.startsWith('p_')) && (realIds.has(m.to) || m.to.startsWith('p_')))
      out.push(`    <bpmn:messageFlow id="${m.id}" name="${esc(m.label)}" sourceRef="${m.from}" targetRef="${m.to}" />`)
  }
  out.push('  </bpmn:collaboration>')

  out.push(`  <bpmn:process id="${pid}" name="${esc(s.processName)}" isExecutable="true">`)
  out.push('    <bpmn:laneSet id="LaneSet_1">')
  for (const lane of g.lanes) {
    // Nama lane = nama jabatan agar Check SOP Lanes di Studio bisa memetakannya.
    out.push(`      <bpmn:lane id="${lane.id}" name="${esc(lane.role)}">`)
    out.push(`        <bpmn:documentation>Aktor di SOP: ${esc(lane.name)}</bpmn:documentation>`)
    for (const n of flowNodes.filter((x) => x.lane === lane.id)) out.push(`        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`)
    out.push('      </bpmn:lane>')
  }
  out.push('    </bpmn:laneSet>')

  for (const n of flowNodes) {
    const doc = `      <bpmn:documentation>${esc(docOf(n, s))}</bpmn:documentation>`
    const name = esc(n.label)
    if (n.kind === 'start') {
      const msg = g.msgs.some((m) => m.to === n.id)
      out.push(`    <bpmn:startEvent id="${n.id}" name="${name}"${formAttr(n)}>`, doc, ...io(n.id))
      if (msg) out.push('      <bpmn:messageEventDefinition />')
      out.push('    </bpmn:startEvent>')
    } else if (n.kind === 'end') {
      out.push(`    <bpmn:endEvent id="${n.id}" name="${name}">`, doc, ...io(n.id), '    </bpmn:endEvent>')
    } else if (n.kind === 'catch') {
      out.push(
        `    <bpmn:intermediateCatchEvent id="${n.id}" name="${name}">`,
        doc,
        ...io(n.id),
        '      <bpmn:messageEventDefinition />',
        '    </bpmn:intermediateCatchEvent>',
      )
    } else if (n.kind === 'xor') {
      out.push(`    <bpmn:exclusiveGateway id="${n.id}" name="${name}">`, doc, ...io(n.id), '    </bpmn:exclusiveGateway>')
    } else {
      out.push(
        `    <bpmn:userTask id="${n.id}" name="${name}" camunda:assignee="\${initiator}" userAssignment:assigneeType="create_using_expression"${formAttr(n)}>`,
        doc,
        '      <bpmn:extensionElements>',
        ...['create', 'assignment', 'update', 'complete'].map(
          (ev) => `        <camunda:taskListener delegateExpression="\${globalTaskListener}" event="${ev}" />`,
        ),
        '      </bpmn:extensionElements>',
        ...io(n.id),
        '    </bpmn:userTask>',
      )
    }
  }

  for (const f of flows) {
    const name = f.label ? ` name="${esc(f.label)}"` : ''
    if (f.cond) {
      const expr = `\${${f.cond.field} ${f.cond.op} '${f.cond.value}'}`
      out.push(
        `    <bpmn:sequenceFlow id="${f.id}"${name} sourceRef="${f.from}" targetRef="${f.to}">`,
        `      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${esc(expr)}</bpmn:conditionExpression>`,
        '    </bpmn:sequenceFlow>',
      )
    } else {
      out.push(`    <bpmn:sequenceFlow id="${f.id}"${name} sourceRef="${f.from}" targetRef="${f.to}" />`)
    }
  }

  // Pertanyaan terbuka jadi textAnnotation agar file tetap valid saat diimpor.
  for (const ph of placeholders) {
    const q = s.questions.find((x) => x.id === ph.question)
    out.push(
      `    <bpmn:textAnnotation id="Ann_${ph.id}">`,
      `      <bpmn:text>${esc(`PERTANYAAN TERBUKA: ${q?.text ?? ph.label}`)}</bpmn:text>`,
      '    </bpmn:textAnnotation>',
    )
  }
  for (const e of pending) out.push(`    <bpmn:association id="Assoc_${e.id}" sourceRef="${e.from}" targetRef="Ann_${e.to}" />`)
  out.push('  </bpmn:process>')

  out.push('  <bpmndi:BPMNDiagram id="BPMNDiagram_1">')
  out.push('    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">')
  const r = Math.round
  const bounds = (x: number, y: number, w: number, h: number) =>
    `<dc:Bounds x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" />`
  out.push(
    `      <bpmndi:BPMNShape id="Participant_main_di" bpmnElement="Participant_main" isHorizontal="true">${bounds(lay.main.x, lay.main.y, lay.main.w, lay.main.h)}</bpmndi:BPMNShape>`,
  )
  for (const lb of lay.lanes) {
    out.push(
      `      <bpmndi:BPMNShape id="${lb.lane.id}_di" bpmnElement="${lb.lane.id}" isHorizontal="true">${bounds(lay.main.x + 30, lb.y, lay.main.w - 30, lb.h)}</bpmndi:BPMNShape>`,
    )
  }
  for (const pb of lay.pools) {
    out.push(
      `      <bpmndi:BPMNShape id="${pb.pool.id}_di" bpmnElement="${pb.pool.id}" isHorizontal="true">${bounds(pb.x, pb.y, pb.w, pb.h)}</bpmndi:BPMNShape>`,
    )
  }
  for (const nb of lay.nodes.values()) {
    const n = nb.node
    if (n.kind === 'placeholder') {
      out.push(
        `      <bpmndi:BPMNShape id="Ann_${n.id}_di" bpmnElement="Ann_${n.id}">${bounds(nb.cx - nb.hw, nb.cy - nb.hh, nb.hw * 2, nb.hh * 2)}</bpmndi:BPMNShape>`,
      )
      continue
    }
    const marker = n.kind === 'xor' ? ' isMarkerVisible="true"' : ''
    out.push(
      `      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${marker}>${bounds(nb.cx - nb.hw, nb.cy - nb.hh, nb.hw * 2, nb.hh * 2)}</bpmndi:BPMNShape>`,
    )
  }
  const wp = (pts: [number, number][]) => pts.map(([x, y]) => `<di:waypoint x="${r(x)}" y="${r(y)}" />`).join('')
  for (const eg of lay.edges) {
    const id = realIds.has(eg.edge.to) ? eg.edge.id : `Assoc_${eg.edge.id}`
    out.push(`      <bpmndi:BPMNEdge id="${id}_di" bpmnElement="${id}">${wp(eg.pts)}</bpmndi:BPMNEdge>`)
  }
  for (const mg of lay.msgs) out.push(`      <bpmndi:BPMNEdge id="${mg.id}_di" bpmnElement="${mg.id}">${wp(mg.pts)}</bpmndi:BPMNEdge>`)
  out.push('    </bpmndi:BPMNPlane>')
  out.push('  </bpmndi:BPMNDiagram>')
  out.push('</bpmn:definitions>')
  return out.join('\n')
}
