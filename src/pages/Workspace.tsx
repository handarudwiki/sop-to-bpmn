import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { scenarios } from '../data/scenarios'
import InputStep from '../components/workspace/InputStep'
import ProcessingStep from '../components/workspace/ProcessingStep'
import Review from '../components/workspace/Review'

type Step = 'input' | 'processing' | 'review'
const STEPS: { id: Step; label: string }[] = [
  { id: 'input', label: 'Dokumen' },
  { id: 'processing', label: 'Ekstraksi' },
  { id: 'review', label: 'Review' },
]

export default function Workspace() {
  const [step, setStep] = useState<Step>('input')
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const scenario = scenarios.find((s) => s.id === scenarioId)!
  const idx = STEPS.findIndex((s) => s.id === step)

  return (
    <main className="relative">
      <div className="glow-top pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1600px] px-4 pt-8 pb-16 sm:px-6">
      <ol className="mb-8 inline-flex items-center gap-1 rounded-full border border-rule bg-surface/80 p-1 shadow-soft backdrop-blur-md" aria-label="Langkah">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            aria-current={i === idx ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-300 ${
              i === idx ? 'bg-ink text-accent-ink shadow-soft' : i < idx ? 'text-ink' : 'text-faint'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10.5px] ${
                i === idx ? 'bg-accent text-accent-ink' : i < idx ? 'bg-ok-soft text-ok' : 'bg-paper-2 text-faint'
              }`}
            >
              {i < idx ? '✓' : i + 1}
            </span>
            {s.label}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 'input' && (
            <InputStep scenarios={scenarios} selected={scenarioId} onSelect={setScenarioId} onStart={() => setStep('processing')} />
          )}
          {step === 'processing' && <ProcessingStep scenario={scenario} onDone={() => setStep('review')} />}
          {step === 'review' && <Review scenario={scenario} onRestart={() => setStep('input')} />}
        </motion.div>
      </AnimatePresence>
      </div>
    </main>
  )
}
