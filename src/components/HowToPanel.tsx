import { useEffect, useRef, useState } from 'react'
import { rich } from '../lib/rich'
import type { HowTo } from '../data/howto'
import type { Control, Score } from '../types'

const TONE: Record<string, string> = { '2': 'ok', '1': 'partial', '0': 'fail', NE: 'ne' }
const LABEL: Record<string, string> = { '2': 'Cumplido', '1': 'Parcial', '0': 'No cumplido', NE: 'N/E' }

interface Props {
  control: Control
  howto: HowTo
  onClose: () => void
  onChoose: (s: Score) => void
}

export function HowToPanel({ control, howto, onClose, onChoose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="howto-title" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <p className="q-kicker">¿Cómo lo hago? · {control.id}</p>
            <h3 id="howto-title">Paso a paso para obtener la evidencia</h3>
            <p className="muted small">Tiempo estimado: {howto.time}</p>
          </div>
          <button ref={closeRef} className="drawer-close" onClick={onClose} aria-label="Cerrar guía">
            ✕
          </button>
        </header>

        <div className="drawer-body">
          <section>
            <h4>Qué necesitas</h4>
            <div className="chips">
              {howto.tools.map((t) =>
                t.url ? (
                  <a key={t.label} className="chip link-chip" href={t.url} target="_blank" rel="noreferrer noopener">
                    {t.label} ↗
                  </a>
                ) : (
                  <span key={t.label} className="chip">
                    {t.label}
                  </span>
                ),
              )}
            </div>
          </section>

          <section>
            <h4>Pasos</h4>
            <ol className="howto-steps">
              {howto.steps.map((s, i) => (
                <li key={i}>
                  <span className="step-n">{i + 1}</span>
                  <div>
                    <p>{rich(s.text)}</p>
                    {s.code && <CodeBlock code={s.code} />}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {howto.lookFor && (
            <section>
              <h4>Qué buscar</h4>
              <ul className="howto-list">
                {howto.lookFor.map((t, i) => (
                  <li key={i}>{rich(t)}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h4>Cómo decidir</h4>
            <p className="muted small">Haz clic en la opción que corresponde a lo que observaste para marcarla.</p>
            <div className="decide">
              {howto.decide.map((d) => (
                <button
                  key={String(d.score)}
                  className={`decide-row ${TONE[String(d.score)]}`}
                  onClick={() => {
                    onChoose(d.score)
                    onClose()
                  }}
                >
                  <span className={`decide-tag ${TONE[String(d.score)]}`}>{LABEL[String(d.score)]}</span>
                  <span>{rich(d.text)}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="evidence-tip">
            <h4>Evidencia a guardar</h4>
            <p>{rich(howto.evidence)}</p>
            <p className="small evidence-how">
              En Windows: captura con <kbd>Win + Shift + S</kbd> (herramienta Recortes) y pégala en un documento con <kbd>Ctrl + V</kbd>, o guarda
              la página completa con <kbd>Ctrl + P</kbd> → <strong>Guardar como PDF</strong>. Asegúrate de que se vea la fecha (la hora de Windows
              en la barra de tareas sirve).
            </p>
          </section>

          {howto.note && <p className="note">{rich(howto.note)}</p>}

          <p className="muted small">
            Todo lo anterior es análisis pasivo: solo observas lo que el sitio entrega a cualquier visitante. No intentes iniciar sesión con datos
            ajenos ni probar ataques.
          </p>
        </div>
      </aside>
    </div>
  )
}

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* portapapeles no disponible */
    }
  }
  return (
    <div className="code-block">
      <pre>{code}</pre>
      <button className="copy-btn" onClick={copy}>
        {copied ? 'Copiado ✓' : 'Copiar'}
      </button>
    </div>
  )
}
