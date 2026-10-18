import { Check, Copy, Download, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormField, Graph, Scenario } from '../../lib/types'

function FieldPreview({ f }: { f: FormField }) {
  if (f.type === 'INPUT_FILE_UPLOAD') {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-ctl)] border border-dashed border-rule-2 bg-paper px-3 py-2.5 text-[12.5px] text-muted">
        <Upload size={14} aria-hidden="true" /> Unggah PDF, maks. 10 MB
      </div>
    )
  }
  if (f.type === 'INPUT_SELECT') {
    return (
      <div className="flex gap-2">
        {(f.options ?? []).map((o) => (
          <span key={o} className="rounded-[var(--radius-ctl)] border border-rule-2 bg-surface px-3 py-1.5 text-[12.5px] text-ink-2 capitalize">
            {o}
          </span>
        ))}
      </div>
    )
  }
  return <div className={`rounded-[var(--radius-ctl)] border border-rule-2 bg-surface ${f.type === 'INPUT_TEXTAREA' ? 'h-14' : 'h-9'}`} />
}

export function FormTab({ graph }: { graph: Graph }) {
  const tasks = graph.nodes.filter((n) => n.form?.length)
  const condFields = new Map(graph.edges.filter((e) => e.cond).map((e) => [e.cond!.field, e]))
  return (
    <div className="p-4 sm:p-5">
      <p className="mb-4 max-w-[52rem] text-[13.5px] text-ink-2">
        Field dibuat hanya untuk task yang memasukkan data. Field yang menentukan cabang gateway memakai nama variabel yang sama dengan kondisinya, sesuai
        aturan <span className="font-mono text-[12.5px]">alurkerja:form</span>.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {tasks.map((t) => (
          <article key={t.id} className="min-w-0 rounded-[var(--radius-card)] border border-rule bg-paper">
            <header className="flex items-center justify-between gap-2 border-b border-rule px-4 py-3">
              <h3 className="text-[15px] font-semibold">{t.label}</h3>
              <span className="font-mono text-[10.5px] text-muted">user task</span>
            </header>
            <div className="space-y-4 p-4">
              {t.form!.map((f) => {
                const cond = condFields.get(f.name)
                return (
                  <div key={f.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-medium text-ink">
                        {f.label}
                        {f.required && <span className="ml-0.5 text-accent">*</span>}
                      </span>
                      <span className="font-mono text-[10px] text-faint">{f.type}</span>
                    </div>
                    <FieldPreview f={f} />
                    <p className="mt-1.5 font-mono text-[10.5px] text-muted">
                      name: {f.name} · dari {f.refs.join(', ')}
                      {cond && (
                        <span className="text-accent-strong">
                          {' '}
                          · dipakai {'${'}
                          {cond.cond!.field} {cond.cond!.op} '{cond.cond!.value}'{'}'}
                        </span>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function MappingTab({ scenario, graph }: { scenario: Scenario; graph: Graph }) {
  return (
    <div className="p-4 sm:p-5">
      <p className="mb-4 max-w-[52rem] text-[13.5px] text-ink-2">
        Fitur Check SOP Lanes di Studio mencocokkan nama lane dengan Struktur Organisasi secara persis, jadi singkatan dan istilah berbeda tidak tertangkap.
        FlowForge memetakan aktor lebih dulu, lalu menamai lane sesuai jabatan, sehingga pencocokan di Studio langsung berhasil.
      </p>
      <div className="overflow-x-auto scroll-thin rounded-[var(--radius-card)] border border-rule">
        <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-paper-2 text-left">
              {['Aktor di SOP', 'Jabatan di Struktur Organisasi', 'Keyakinan', 'Alasan', 'Sumber'].map((h) => (
                <th key={h} className="border-b border-rule px-4 py-2.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-muted uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {graph.lanes.map((l) => {
              const low = l.score < 0.8
              return (
                <tr key={l.id} className="align-top">
                  <td className="border-b border-rule px-4 py-3 font-medium text-ink">{l.name}</td>
                  <td className="border-b border-rule px-4 py-3 text-ink-2">{l.role}</td>
                  <td className="border-b border-rule px-4 py-3">
                    <span
                      className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                        l.by ? 'bg-ok-soft text-ok' : low ? 'bg-warn-soft text-warn-ink' : 'bg-accent-soft text-accent-strong'
                      }`}
                    >
                      {l.by ? 'ditetapkan' : `${Math.round(l.score * 100)}%${low ? ' · cek' : ''}`}
                    </span>
                  </td>
                  <td className="border-b border-rule px-4 py-3 text-ink-2">{l.reason}</td>
                  <td className="border-b border-rule px-4 py-3 font-mono text-[12px] text-muted">{l.by ? l.by.toUpperCase().replace('Q', 'P') : l.refs.join(', ')}</td>
                </tr>
              )
            })}
            {graph.pools.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="border-b border-rule px-4 py-3 font-medium text-ink">{p.name}</td>
                <td className="border-b border-rule px-4 py-3 text-muted">Pihak eksternal, jadi pool terpisah</td>
                <td className="border-b border-rule px-4 py-3">
                  <span className="rounded-[4px] bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">pool</span>
                </td>
                <td className="border-b border-rule px-4 py-3 text-ink-2">Tidak ditugaskan task. Berinteraksi lewat message flow.</td>
                <td className="border-b border-rule px-4 py-3 font-mono text-[12px] text-muted">{p.refs.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[12.5px] text-muted">
        Jabatan tersedia di workspace: <span className="text-ink-2">{scenario.orgRoles.join(' · ')}</span>
      </p>
    </div>
  )
}

function highlight(xml: string) {
  const esc = xml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // Warnai atribut sebelum nama tag agar span sisipan tidak ikut tercocokkan.
  return esc
    .replace(/([\w:]+)="(.*?)"/g, '<span class="text-on-graphite-2">$1</span>=<span class="text-ok-soft">"$2"</span>')
    .replace(/(&lt;\/?)([\w:]+)/g, '$1<span class="text-accent-line">$2</span>')
}

export function XmlTab({ xml, fileName, onDownload }: { xml: string; fileName: string; onDownload: () => void }) {
  const html = useMemo(() => highlight(xml), [xml])
  const [ok, setOk] = useState(false)
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[46rem] text-[13.5px] text-ink-2">
          Ditulis oleh compiler, bukan oleh model. Unggah lewat Studio → Drive → <span className="font-medium text-ink">Upload BPMN or DMN file</span>.
        </p>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(xml)
              setOk(true)
              setTimeout(() => setOk(false), 1500)
            }}
          >
            {ok ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} {ok ? 'Tersalin' : 'Salin XML'}
          </button>
          <button className="btn btn-primary" onClick={onDownload}>
            <Download size={15} aria-hidden="true" /> Unduh
          </button>
        </div>
      </div>
      <figure className="overflow-hidden rounded-[var(--radius-card)] border border-graphite-rule bg-graphite">
        <figcaption className="flex items-center justify-between border-b border-graphite-rule px-4 py-2.5 font-mono text-[11.5px] text-on-graphite-2">
          <span>{fileName}</span>
          <span>{(new Blob([xml]).size / 1024).toFixed(1)} KB</span>
        </figcaption>
        <pre
          className="max-h-[60vh] overflow-auto p-4 font-mono text-[11.5px] leading-[1.65] text-on-graphite scroll-thin"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </figure>
    </div>
  )
}
