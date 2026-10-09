import { useCallback, useEffect, useState } from 'react'
import { CONTROLS } from './data/instrument'
import { Checklist } from './components/Checklist'
import { ControlStep } from './components/ControlStep'
import { DimensionIntro } from './components/DimensionIntro'
import { FindingsStep } from './components/FindingsStep'
import { MetaStep } from './components/MetaStep'
import { Results } from './components/Results'
import { Welcome } from './components/Welcome'
import { clearDraft, emptyEvaluation, loadDraft, saveDraft } from './lib/storage'
import { resumeStep, stepIndexOf, STEPS } from './steps'
import type { Answer, Evaluation, Finding, Meta } from './types'

export default function App() {
  const [draft] = useState(loadDraft)
  const [ev, setEv] = useState<Evaluation>(() => draft ?? emptyEvaluation())
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [started, setStarted] = useState(false)

  // Autoguardado local (solo en este navegador) una vez iniciada la evaluación.
  useEffect(() => {
    if (started) saveDraft(ev)
  }, [ev, started])

  const go = useCallback(
    (to: number) => {
      setDir(to >= step ? 'fwd' : 'back')
      setStep(Math.max(0, Math.min(STEPS.length - 1, to)))
      window.scrollTo({ top: 0 })
    },
    [step],
  )
  const next = useCallback(() => go(step + 1), [go, step])
  const back = useCallback(() => go(step - 1), [go, step])

  const update = (fn: (e: Evaluation) => Evaluation) => setEv((e) => ({ ...fn(e), updatedAt: new Date().toISOString() }))
  const setMeta = (key: keyof Meta, value: string) => update((e) => ({ ...e, meta: { ...e.meta, [key]: value } }))
  const setAnswer = (id: string, a: Answer) => update((e) => ({ ...e, answers: { ...e.answers, [id]: a } }))
  const setChecklist = (id: string, value: boolean) => update((e) => ({ ...e, checklist: { ...e.checklist, [id]: value } }))
  const setFindings = (findings: Finding[]) => update((e) => ({ ...e, findings }))

  const start = (evaluation: Evaluation, at: number) => {
    setEv(evaluation)
    setStarted(true)
    go(at)
  }

  const s = STEPS[step]
  const allAnswered = CONTROLS.every((c) => ev.answers[c.id]?.score != null)
  const progress = step / (STEPS.length - 1)

  return (
    <div className="app">
      {s.kind !== 'welcome' && (
        <header className="topbar">
          <button className="brand" onClick={() => go(0)} title="Volver al inicio">
            MESGE
          </button>
          <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="local-badge" title="Las respuestas se guardan solo en este navegador. Nada se envía a un servidor.">
            <LockIcon /> Procesado localmente
          </span>
        </header>
      )}

      <main className="stage">
        <div key={step} className={`step-anim ${dir}`}>
          {s.kind === 'welcome' && (
            <Welcome
              hasDraft={draft !== null && started === false}
              draftLabel={draft?.meta.institution}
              onStart={() => start(emptyEvaluation(), 1)}
              onResume={() => draft && start(draft, resumeStep(draft))}
              onImport={(imported) => start(imported, resumeStep(imported))}
              inProgress={started}
              onContinue={() => go(resumeStep(ev))}
            />
          )}
          {s.kind === 'checklist' && (
            <Checklist ev={ev} onToggle={setChecklist} onPlatform={(v) => setMeta('platform', v)} onNext={next} />
          )}
          {s.kind === 'meta' && (
            <MetaStep field={s.field} number={s.number} value={ev.meta[s.field.key]} onChange={(v) => setMeta(s.field.key, v)} onNext={next} />
          )}
          {s.kind === 'dimension' && <DimensionIntro dimension={s.dimension} index={s.index} answers={ev.answers} onNext={next} />}
          {s.kind === 'control' && (
            <ControlStep
              step={s}
              answer={ev.answers[s.control.id]}
              answers={ev.answers}
              onChange={(a) => setAnswer(s.control.id, a)}
              onNext={next}
            />
          )}
          {s.kind === 'findings' && <FindingsStep ev={ev} onChange={setFindings} onNext={next} />}
          {s.kind === 'results' && (
            <Results
              ev={ev}
              onGoTo={go}
              onReset={() => {
                if (window.confirm('¿Borrar la evaluación actual de este navegador y comenzar una nueva?')) {
                  clearDraft()
                  setStarted(false)
                  setEv(emptyEvaluation())
                  go(0)
                }
              }}
            />
          )}
        </div>
      </main>

      {s.kind !== 'welcome' && s.kind !== 'results' && (
        <nav className="stepper" aria-label="Navegación entre preguntas">
          {allAnswered && (
            <button className="to-results" onClick={() => go(stepIndexOf('results'))} onMouseDown={(e) => e.preventDefault()}>
              Ver resultados
            </button>
          )}
          <button onClick={back} onMouseDown={(e) => e.preventDefault()} aria-label="Anterior" title="Anterior">
            <Chevron up />
          </button>
          <button onClick={next} onMouseDown={(e) => e.preventDefault()} aria-label="Siguiente" title="Siguiente">
            <Chevron />
          </button>
        </nav>
      )}
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function Chevron({ up }: { up?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  )
}
