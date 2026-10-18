import { ArrowLeft, ArrowRight } from 'lucide-react'

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <path d="M11 8.5V23.5M11 9.5H19.5M11 16.2H16.5" fill="none" className="stroke-accent-ink" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22.4" cy="9.5" r="2.5" className="fill-glow-indigo" />
      <circle cx="19.3" cy="16.2" r="2.1" className="fill-accent-ink" opacity="0.7" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[16.5px] font-semibold tracking-[-0.02em] text-ink">FlowForge</span>
    </span>
  )
}

export function Nav({ view }: { view: 'landing' | 'workspace' }) {
  if (view === 'workspace') {
    return (
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="#/" aria-label="FlowForge, beranda">
              <Logo />
            </a>
            <span className="hidden h-5 w-px bg-rule-2 sm:block" aria-hidden="true" />
            <span className="hidden text-[13.5px] text-muted sm:block">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono-label hidden rounded-full border border-rule-2 bg-surface px-3 py-1.5 text-muted sm:inline">Prototipe Alpha · data contoh</span>
            <a href="#/" className="btn btn-ghost">
              <ArrowLeft size={15} aria-hidden="true" /> Beranda
            </a>
          </div>
        </div>
      </header>
    )
  }
  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 rounded-full border border-rule bg-surface/75 py-2 pr-2 pl-4 shadow-lift backdrop-blur-xl">
        <a href="#/" aria-label="FlowForge, beranda">
          <Logo />
        </a>
        <nav className="hidden items-center gap-7 text-[14px] text-ink-2 md:flex" aria-label="Utama">
          <a className="link-underline" href="#cara-kerja">
            Cara kerja
          </a>
          <a className="link-underline" href="#pembeda">
            Pembeda
          </a>
          <a className="link-underline" href="#alurkerja">
            AlurKerja
          </a>
        </nav>
        <a href="#/workspace" className="btn btn-primary">
          Buka workspace <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}

export function Footer({ view }: { view: 'landing' | 'workspace' }) {
  return (
    <footer className="border-t border-rule">
      <div
        className={`mx-auto flex ${view === 'workspace' ? 'max-w-[1600px]' : 'max-w-[1200px]'} flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6`}
      >
        <span className="flex items-center gap-3">
          <LogoMark size={22} />
          <span>
            <span className="font-medium text-ink">FlowForge</span> · Dokumen SOP menjadi BPMN yang bisa ditelusuri, untuk AlurKerja.
          </span>
        </span>
        <span className="mono-label">ANGEL Innovation Hackathon 2026 · Topik 1</span>
      </div>
    </footer>
  )
}
