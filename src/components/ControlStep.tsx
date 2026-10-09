import { useCallback, useEffect, useRef, useState } from 'react'
import { HOWTO } from '../data/howto'
import { useEnter, useKeyShortcuts } from '../hooks'
import { DEPENDS_ON, type Step } from '../steps'
import type { Answer, Score } from '../types'
import { HowToPanel } from './HowToPanel'
import { Arrow, Check } from './MetaStep'

const OPTIONS: { key: string; score: Score; label: string; pts: string; tone: string }[] = [
  { key: 'a', score: 2, label: 'Cumplido', pts: '2 pts', tone: 'ok' },
  { key: 'b', score: 1, label: 'Parcialmente cumplido', pts: '1 pt', tone: 'partial' },
  { key: 'c', score: 0, label: 'No cumplido', pts: '0 pts', tone: 'fail' },
  { key: 'd', score: 'NE', label: 'No evaluable (N/E)', pts: 'excluido', tone: 'ne' },
]

const EVIDENCE_PLACEHOLDER: Record<string, string> = {
  '2': 'Describe la evidencia objetiva que demuestra la implementación correcta (herramienta, fecha, resultado).',
  '1': 'Obligatorio: indica QUÉ evidencia específica muestra que el control está implementado de forma incompleta.',
  '0': 'Describe la evidencia de ausencia o implementación incorrecta.',
  NE: 'Explica por qué el control no es verificable mediante análisis pasivo.',
}

interface Props {
  step: Extract<Step, { kind: 'control' }>
  answer: Answer | undefined
  answers: Record<string, Answer>
  onChange: (a: Answer) => void
  onNext: () => void
}

export function ControlStep({ step, answer, answers, onChange, onNext }: Props) {
  const { control, dimension, indexInDim, countInDim, number } = step
  const score = answer?.score ?? null
  const evidence = answer?.evidence ?? ''
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(true)
  const [howtoOpen, setHowtoOpen] = useState(false)
  const closeHowto = useCallback(() => setHowtoOpen(false), [])
  const howto = HOWTO[control.id]
  const evidenceRef = useRef<HTMLTextAreaElement>(null)

  const parent = DEPENDS_ON[control.id]
  const parentNE = parent && answers[parent]?.score === 'NE'

  // Si el control del que depende es N/E, se sugiere N/E automáticamente.
  useEffect(() => {
    if (parentNE && score === null) {
      onChange({ score: 'NE', evidence: `N/E: Dependiente de ${parent}, que fue marcado como no evaluable.` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choose = (s: Score) => {
    setError('')
    onChange({ score: s, evidence })
    requestAnimationFrame(() => evidenceRef.current?.focus())
  }

  const submit = () => {
    if (score === null) return setError('Selecciona una opción para continuar.')
    if (score === 1 && !evidence.trim())
      return setError('El nivel Parcial requiere documentar la evidencia específica que justifica la calificación.')
    onNext()
  }

  useEnter(submit, !howtoOpen)
  useKeyShortcuts(
    {
      ...Object.fromEntries(OPTIONS.flatMap((o, i) => [[o.key, () => choose(o.score)], [String(i + 1), () => choose(o.score)]])),
      ...(howto ? { h: () => setHowtoOpen(true) } : {}),
    },
    !howtoOpen,
  )

  const refs = control.reference.split('|').map((r) => r.trim())

  return (
    <section className="question">
      <p className="q-kicker">
        <span className="dim-pill">{dimension.id}</span> {dimension.name} · Control {indexInDim + 1} de {countInDim}
      </p>
      <h2 className="q-title">
        <span className="q-num">
          {number}
          <Arrow />
        </span>
        {control.statement}
      </h2>
      <p className="control-id">{control.id}</p>

      <div className="guide">
        <div className="guide-head">
          <button className="guide-toggle" onClick={() => setShowGuide((v) => !v)} aria-expanded={showGuide}>
            {showGuide ? '▾' : '▸'} Guía de evidencia (análisis pasivo)
          </button>
          {howto && (
            <button className="btn howto-btn sm" onClick={() => setHowtoOpen(true)}>
              <span className="howto-icon" aria-hidden>
                ?
              </span>
              ¿Cómo lo hago?
            </button>
          )}
        </div>
        {showGuide && (
          <>
            <p>{control.guide}</p>
            <div className="chips">
              {refs.map((r) => (
                <span className="chip" key={r}>
                  {r}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {parentNE && <p className="note">Este control depende de {parent}, que marcaste como N/E. Se sugiere clasificarlo también como N/E.</p>}

      <div className="options" role="radiogroup" aria-label="Estado del control">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            role="radio"
            aria-checked={score === o.score}
            className={`option ${o.tone} ${score === o.score ? 'selected' : ''}`}
            onClick={() => choose(o.score)}
          >
            <kbd className="opt-key">{o.key.toUpperCase()}</kbd>
            <span className="opt-label">{o.label}</span>
            <span className="opt-pts">{o.pts}</span>
            {score === o.score && (
              <span className="opt-check">
                <Check />
              </span>
            )}
          </button>
        ))}
      </div>

      {score !== null && (
        <label className="evidence">
          <span>
            Evidencia {score === 1 ? <span className="req">* obligatoria para Parcial</span> : <span className="muted">(recomendada)</span>}
          </span>
          <textarea
            ref={evidenceRef}
            rows={3}
            value={evidence}
            placeholder={EVIDENCE_PLACEHOLDER[String(score)]}
            onChange={(e) => {
              setError('')
              onChange({ score, evidence: e.target.value })
            }}
          />
        </label>
      )}

      {howtoOpen && howto && <HowToPanel control={control} howto={howto} onClose={closeHowto} onChoose={choose} />}

      {error && <p className="error">{error}</p>}
      <div className="q-actions">
        <button className="btn primary" onClick={submit}>
          Continuar <Check />
        </button>
        <span className="hint">
          Teclas <kbd>A</kbd>–<kbd>D</kbd> para elegir · <kbd>H</kbd> ayuda · <kbd>Enter ↵</kbd> para avanzar{score !== null && <> (en el texto: <kbd>Ctrl + Enter</kbd>)</>}
        </span>
      </div>
    </section>
  )
}
