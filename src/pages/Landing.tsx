import { motion } from 'motion/react'
import { ArrowRight, Braces, FileText, GitBranch, HelpCircle, ListChecks, Sparkles, Table2, Upload, Workflow } from 'lucide-react'
import BlurText from '../components/rb/BlurText'
import SpotlightCard from '../components/rb/SpotlightCard'
import HeroShowcase from '../components/HeroShowcase'
import TraceHero from '../components/TraceHero'

const ease = [0.16, 1, 0.3, 1] as const
const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease },
}

const PIPELINE = [
  { icon: FileText, title: 'Baca dokumen', body: 'Prosa atau tabel SOP AP dipecah jadi kalimat bernomor sebagai jangkar jejak.' },
  { icon: Workflow, title: 'Ekstraksi IR', body: 'Model bahasa mengisi JSON perantara: aktor, task, gateway, loop.' },
  { icon: ListChecks, title: 'Validasi', body: 'Kode memeriksa struktur. Error dikirim balik ke model, maksimal tiga kali.' },
  { icon: HelpCircle, title: 'Tanya, bukan tebak', body: 'Cabang tanpa akhir dan penyetuju yang tak disebut jadi pertanyaan.' },
  { icon: GitBranch, title: 'Petakan jabatan', body: 'Aktor dicocokkan ke Struktur Organisasi, termasuk singkatan.' },
  { icon: Upload, title: 'Compile BPMN', body: 'Kode menulis BPMN 2.0 + koordinat diagram dengan dialek AlurKerja.' },
]

export default function Landing() {
  return (
    <main className="-mt-[68px]">
      <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] overflow-hidden" aria-hidden="true">
          <div className="aurora-blob aurora-a" />
          <div className="aurora-blob aurora-b" />
          <div className="aurora-blob aurora-c" />
        </div>
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-70" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-[420px] h-[300px] bg-gradient-to-b from-transparent to-paper" aria-hidden="true" />

        <div className="relative mx-auto max-w-[1200px] px-4 text-center sm:px-6">
          <motion.a
            href="#cara-kerja"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-rule bg-surface/80 py-1.5 pr-3 pl-1.5 text-[13px] text-ink-2 shadow-soft backdrop-blur-md hover:border-accent-line"
          >
            <span className="flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">
              <Sparkles size={12} aria-hidden="true" /> Topik 1
            </span>
            AI-Powered SOP to Executable Business Process
            <ArrowRight size={13} className="text-muted" aria-hidden="true" />
          </motion.a>

          <h1 className="serif mx-auto mt-8 max-w-[15ch] text-[clamp(3rem,7vw+0.5rem,6.4rem)] leading-[0.98] text-ink">
            <BlurText text="SOP ditempa menjadi proses yang" animateBy="words" delay={60} trigger="load" className="justify-center" />
            <span className="relative inline-block text-accent">
              <BlurText text="siap dijalankan." animateBy="words" delay={60} trigger="load" className="justify-center" />
              <motion.svg
                viewBox="0 0 300 14"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-3 w-full overflow-visible"
                aria-hidden="true"
              >
                <motion.path
                  d="M4 9 C 80 3, 200 3, 296 8"
                  fill="none"
                  className="stroke-accent-line"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease, delay: 0.9 }}
                />
              </motion.svg>
            </span>
          </h1>

          <motion.p
            className="mx-auto mt-7 max-w-[40rem] text-[17.5px] leading-relaxed text-ink-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.55 }}
          >
            FlowForge membaca dokumen SOP utuh, prosa maupun tabel SOP AP, lalu menyusun draf BPMN untuk AlurKerja. Setiap elemen menunjuk ke kalimat
            sumbernya, dan celah di SOP muncul sebagai pertanyaan, bukan tebakan.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.7 }}
          >
            <a href="#/workspace" className="btn btn-primary px-5 py-3.5 text-[15px]">
              Coba dengan SOP contoh <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#cara-kerja" className="btn btn-ghost px-5 py-3.5 text-[15px]">
              Lihat cara kerja
            </a>
          </motion.div>
        </div>

        <motion.div
          className="relative mt-20 px-4 sm:px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.5 }}
        >
          <HeroShowcase />
        </motion.div>
      </section>

      <section className="border-y border-rule bg-surface/60">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-[13.5px] text-muted sm:px-6">
          <span className="mono-label text-faint">Dirancang untuk</span>
          {['AlurKerja Studio', 'Camunda 7', 'BPMN 2.0 + DI', 'Format SOP AP (Permenpan RB 35/2012)', 'Bahasa Indonesia'].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-line" aria-hidden="true" />
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-28 sm:px-6">
        <div className="grid grid-cols-1 items-end gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <motion.figure {...reveal} className="min-w-0">
            <p className="serif text-[clamp(2.2rem,3.6vw+0.6rem,3.9rem)] leading-[1.04] text-ink">
              “2 minggu, 3 minggu … hanya untuk menyetujui bagaimana persisnya proses bisnis itu.”
            </p>
            <figcaption className="mt-6 flex items-center gap-3 text-[14px] text-muted">
              <span className="h-px w-10 bg-rule-2" aria-hidden="true" />
              Pembicara Javan, webinar Loan Origination System with BPMN 2.0, menit 53:22
            </figcaption>
          </motion.figure>
          <motion.ul {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="card min-w-0 divide-y divide-rule">
            {[
              ['Analis membaca dokumen dan juknis satu per satu, lalu menggambar BPMN manual.', 'Webinar yang sama, menit 7:52'],
              ['“Apakah saya harus paham BPMN untuk bisa menggunakan AlurKerja?” Jawabannya: ya.', 'FAQ dokumentasi AlurKerja'],
              ['Ribuan SOP pemerintah sudah ditulis dalam format tabel SOP AP yang seragam.', 'Permenpan RB No. 35 Tahun 2012'],
            ].map(([t, src]) => (
              <li key={src} className="px-6 py-5">
                <p className="text-[15px] leading-relaxed text-ink">{t}</p>
                <p className="mt-1.5 font-mono text-[11.5px] text-muted">{src}</p>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      <section id="cara-kerja" className="relative scroll-mt-24 overflow-hidden bg-graphite text-on-graphite">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(50% 60% at 15% 0%, oklch(46% 0.2 270 / 0.45), transparent 70%), radial-gradient(40% 50% at 90% 100%, oklch(55% 0.16 300 / 0.3), transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1200px] px-4 py-28 sm:px-6">
          <motion.div {...reveal} className="max-w-[44rem]">
            <p className="mono-label text-on-graphite-2">Cara kerja</p>
            <h2 className="serif mt-4 text-[clamp(2.4rem,3.6vw+0.6rem,4rem)] leading-[1.02] text-on-graphite">
              Model mengisi struktur. Kode yang menulis XML.
            </h2>
            <p className="mt-5 max-w-[36rem] text-[16px] leading-relaxed text-on-graphite-2">
              Model bahasa hanya mengisi representasi perantara yang terstruktur. Validasi, tata letak diagram, dan BPMN XML ditulis oleh kode, sehingga hasilnya
              konsisten dari dokumen ke dokumen.
            </p>
          </motion.div>

          <div className="relative mt-16">
            <div
              className="absolute top-[22px] right-[8%] left-[8%] hidden h-px lg:block"
              style={{ background: 'linear-gradient(90deg, transparent, oklch(78% 0.1 268 / 0.7), transparent)' }}
              aria-hidden="true"
            />
            <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {PIPELINE.map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, ease, delay: i * 0.08 }}
                  className="relative flex flex-col"
                >
                  <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-graphite-rule bg-graphite-2 shadow-[0_0_0_6px_oklch(18.5%_0.03_270)]">
                    <s.icon size={18} className="text-accent-line" aria-hidden="true" />
                  </div>
                  <div className="mt-5 flex-1 rounded-[14px] border border-graphite-rule bg-graphite-2/70 p-5 backdrop-blur-sm">
                    <span className="font-mono text-[11px] text-on-graphite-2">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="mt-2 text-[16px] font-semibold text-on-graphite">{s.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-on-graphite-2">{s.body}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
          <p className="mt-8 font-mono text-[12px] text-on-graphite-2">07 · Analis meninjau draf, menjawab pertanyaan, lalu mengunggah .bpmn ke Studio AlurKerja.</p>
        </div>
      </section>

      <section id="pembeda" className="mx-auto max-w-[1200px] scroll-mt-24 px-4 py-28 sm:px-6">
        <motion.div {...reveal} className="max-w-[44rem]">
          <p className="mono-label text-muted">Pembeda</p>
          <h2 className="serif mt-4 text-[clamp(2.4rem,3.6vw+0.6rem,4rem)] leading-[1.02]">Dibuat untuk dokumen, bukan deskripsi singkat.</h2>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Tile className="lg:col-span-2" title="Setiap elemen punya sumber" body="Klik task, kalimat SOP asalnya menyala. Jejak ini ikut tersimpan di file BPMN, jadi asal setiap keputusan bisa diperiksa.">
            <div className="mt-6 rounded-[14px] border border-rule bg-paper p-4">
              <TraceHero bare />
            </div>
          </Tile>

          <Tile title="Bertanya, bukan menebak" body="Celah di SOP tidak diisi model. Jabatan penyetuju yang tak disebut ditanyakan, lalu diagram diperbarui.">
            <div className="mt-6 rounded-[14px] border border-rule bg-paper p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-warn-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold text-warn-ink">P1</span>
                <span className="font-mono text-[10.5px] text-muted">dari S3</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-snug font-medium text-ink">Setelah pengajuan dikembalikan, apakah nasabah dapat mengajukan ulang?</p>
              <div className="mt-3 space-y-2 text-[12.5px]">
                <div className="rounded-[10px] border border-accent bg-accent-soft px-3 py-2 font-medium text-accent-strong">Ya, dokumen perbaikan diperiksa ulang</div>
                <div className="rounded-[10px] border border-rule-2 bg-surface px-3 py-2 text-ink-2">Tidak, pengajuan ditutup</div>
              </div>
            </div>
          </Tile>

          <Tile icon={Table2} title="Paham tabel SOP AP" body="Kolom Pelaksana jadi lane, Kelengkapan jadi field form, Waktu jadi SLA.">
            <div className="mt-6 space-y-2 text-[12.5px]">
              {[
                ['Memverifikasi berkas', 'Kasubbag Umum', '30 menit'],
                ['Menyusun konsep surat', 'Petugas Loket', '1 jam'],
                ['Menandatangani surat', 'Kepala Dinas', '1 hari'],
              ].map(([k, p, w]) => (
                <div key={k} className="flex items-center justify-between gap-2 rounded-[10px] border border-rule bg-paper px-3 py-2">
                  <span className="truncate text-ink">{k}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-strong">{p}</span>
                    <span className="font-mono text-[10.5px] text-muted">{w}</span>
                  </span>
                </div>
              ))}
            </div>
          </Tile>

          <Tile icon={GitBranch} title="Pemetaan jabatan" body="Singkatan dan istilah berbeda tetap tertangkap, sehingga Check SOP Lanes di Studio langsung cocok.">
            <div className="mt-6 space-y-2 text-[12.5px]">
              {[
                ['Kasubbag Umum', 'Kepala Subbagian Umum', '97%', false],
                ['Analis', 'Analis Kredit', '94%', false],
                ['Petugas', 'Customer Service Officer', '78% · cek', true],
              ].map(([a, b, sc, low]) => (
                <div key={a as string} className="flex items-center gap-2 rounded-[10px] border border-rule bg-paper px-3 py-2">
                  <span className="text-ink">{a}</span>
                  <ArrowRight size={12} className="shrink-0 text-faint" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-ink-2">{b}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10.5px] ${low ? 'bg-warn-soft text-warn-ink' : 'bg-accent-soft text-accent-strong'}`}>
                    {sc}
                  </span>
                </div>
              ))}
            </div>
          </Tile>

          <Tile icon={Braces} title="Dialek AlurKerja" body="Namespace alurkerja:form, penugasan userAssignment, dan dokumentasi sumber per elemen.">
            <pre className="mt-6 overflow-x-auto rounded-[12px] bg-graphite p-4 font-mono text-[11px] leading-[1.7] text-on-graphite-2 scroll-thin">
              <span className="text-accent-line">&lt;bpmn:userTask</span> name=<span className="text-on-graphite">"Periksa Kelengkapan"</span>
              {'\n  '}userAssignment:assigneeType=<span className="text-on-graphite">"…"</span>
              {'\n  '}alurkerja:form=<span className="text-on-graphite">"[…]"</span>
              <span className="text-accent-line">&gt;</span>
              {'\n  '}
              <span className="text-accent-line">&lt;bpmn:documentation&gt;</span>
              {'\n    '}
              <span className="text-on-graphite">Sumber: S2 "Petugas memeriksa…"</span>
            </pre>
          </Tile>
        </div>
      </section>

      <section id="alurkerja" className="scroll-mt-24 border-t border-rule bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-4 py-28 sm:px-6">
          <motion.div {...reveal} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <p className="mono-label text-muted">Posisi</p>
              <h2 className="serif mt-4 text-[clamp(2.4rem,3.6vw+0.6rem,4rem)] leading-[1.02]">Melengkapi AlurKerja, tidak menggantikannya.</h2>
            </div>
            <p className="max-w-[34rem] text-[16px] leading-relaxed text-ink-2">
              Generator di Studio bekerja dari deskripsi singkat yang diketik pengguna. FlowForge bekerja dari dokumen SOP yang sudah ada. Keduanya bertemu di Studio,
              tempat proses di-deploy dan dijalankan.
            </p>
          </motion.div>

          <motion.ol {...reveal} className="mt-14 flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {[
              { k: 'Dokumen SOP', v: '.docx · .pdf · tabel SOP AP' },
              { k: 'FlowForge', v: 'draf + jejak + pertanyaan', us: true },
              { k: 'File .bpmn', v: 'BPMN 2.0 + dialek AlurKerja' },
              { k: 'Studio', v: 'Drive → Upload BPMN' },
              { k: 'Deploy', v: 'Testing → Live' },
              { k: 'Aplikasi', v: 'My Tasks · Requests' },
            ].map((s, i, arr) => (
              <li key={s.k} className="flex min-w-0 flex-1 items-center gap-3">
                {s.us ? (
                  <div className="relative flex-1 rounded-[16px] bg-gradient-to-br from-glow-indigo via-accent to-glow-lilac p-px shadow-lift">
                    <div className="h-full rounded-[15px] bg-surface px-4 py-4">
                      <p className="flex items-center gap-1.5 text-[15px] font-semibold text-accent-strong">
                        <Sparkles size={14} aria-hidden="true" /> {s.k}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted">{s.v}</p>
                    </div>
                  </div>
                ) : (
                  <div className="card flex-1 px-4 py-4">
                    <p className="text-[15px] font-semibold text-ink">{s.k}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted">{s.v}</p>
                  </div>
                )}
                {i < arr.length - 1 && <ArrowRight size={15} className="hidden shrink-0 text-faint lg:block" aria-hidden="true" />}
              </li>
            ))}
          </motion.ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[28px] border border-rule bg-surface px-6 py-16 text-center shadow-lift sm:px-12">
          <div className="glow-top pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative">
            <h2 className="serif mx-auto max-w-[18ch] text-[clamp(2.2rem,3.4vw+0.6rem,3.6rem)] leading-[1.04]">Lihat jejaknya pada dua SOP contoh.</h2>
            <p className="mx-auto mt-4 max-w-[34rem] text-[16px] text-ink-2">Prosa SOP kredit dan tabel SOP AP pemerintah. Jawab pertanyaannya, lalu ekspor file .bpmn.</p>
            <a href="#/workspace" className="btn btn-primary mt-8 px-6 py-3.5 text-[15px]">
              Buka workspace <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  )
}

function Tile({
  title,
  body,
  icon: Icon,
  className = '',
  children,
}: {
  title: string
  body: string
  icon?: typeof Table2
  className?: string
  children?: React.ReactNode
}) {
  return (
    <motion.div {...reveal} className={`min-w-0 ${className}`}>
      <SpotlightCard
        theme="light"
        spotlightColor="var(--color-glow-indigo)"
        intensity={0.14}
        className="!rounded-[20px] h-full border border-rule !bg-surface !p-6 shadow-soft"
      >
        {Icon && <Icon size={20} className="text-accent" aria-hidden="true" />}
        <h3 className={`${Icon ? 'mt-4' : ''} text-[19px] font-semibold tracking-[-0.02em]`}>{title}</h3>
        <p className="mt-2 max-w-[34rem] text-[14.5px] leading-relaxed text-ink-2">{body}</p>
        {children}
      </SpotlightCard>
    </motion.div>
  )
}
