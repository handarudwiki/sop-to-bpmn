import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import LatticeLoader from '../rb/LatticeLoader'
import StatusMark from '../rb/StatusMark'
import type { Scenario } from '../../lib/types'

const STEP_MS = 1050

export default function ProcessingStep({ scenario, onDone }: { scenario: Scenario; onDone: () => void }) {
  const [done, setDone] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const total = scenario.log.length

  useEffect(() => {
    if (done >= total) {
      const t = setTimeout(onDone, 900)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setDone((d) => d + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [done, total, onDone])

  const startRef = useRef(performance.now())
  useEffect(() => {
    if (done >= total) return
    const t = setInterval(() => setElapsed((performance.now() - startRef.current) / 1000), 100)
    return () => clearInterval(t)
  }, [done, total])

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="serif text-[44px] leading-[1.02]">Mengekstrak proses</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        {scenario.fileName} · {scenario.kindLabel}
      </p>

      <div className="mt-8 card">
        <div className="border-b border-rule px-5 py-4">
          <LatticeLoader
            label="Menyusun draf BPMN"
            doneLabel="Draf siap direview"
            status={done >= total ? 'done' : 'working'}
            pattern="snake"
            color="var(--color-accent)"
            doneColor="var(--color-ok)"
            showTimer
            elapsed={elapsed}
            fontSize={14}
          />
        </div>
        <ol className="divide-y divide-rule">
          {scenario.log.map((l, i) => {
            const status = i < done ? 'done' : i === done ? 'running' : 'pending'
            return (
              <li key={l.stage} className="flex items-start gap-4 px-5 py-4">
                <StatusMark
                  status={status}
                  size={20}
                  color="var(--color-accent)"
                  doneColor="var(--color-ok)"
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className={`text-[15px] font-medium ${status === 'pending' ? 'text-faint' : 'text-ink'}`}>{l.stage}</p>
                  {status === 'done' && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-1 font-mono text-[12.5px] text-muted"
                    >
                      {l.detail}
                    </motion.p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
      <p className="mt-4 font-mono text-[11.5px] text-faint">Simulasi: hasil ekstraksi di prototipe ini berasal dari data contoh.</p>
    </div>
  )
}
