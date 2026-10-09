import { CONTROLS, DIMENSIONS } from '../data/instrument'
import { useEnter } from '../hooks'
import { DIMENSION_TOOLS } from '../steps'
import type { Answer, Dimension } from '../types'

interface Props {
  dimension: Dimension
  index: number
  answers: Record<string, Answer>
  onNext: () => void
}

export function DimensionIntro({ dimension, index, answers, onNext }: Props) {
  useEnter(onNext)
  const controls = CONTROLS.filter((c) => c.dimension === dimension.id)
  const done = controls.filter((c) => answers[c.id]?.score != null).length
  const info = DIMENSION_TOOLS[dimension.id]

  return (
    <section className="dim-intro">
      <p className="q-kicker">
        Dimensión {index + 1} de {DIMENSIONS.length}
      </p>
      <div className="dim-badge">{dimension.id}</div>
      <h2 className="dim-title">{dimension.name}</h2>
      <div className="dim-meta">
        <span>
          <strong>{Math.round(dimension.weight * 100)} %</strong> del IMS
        </span>
        <span>
          <strong>{controls.length}</strong> controles
        </span>
        {done > 0 && (
          <span>
            <strong>{done}</strong> ya respondidos
          </span>
        )}
      </div>
      <div className="tool-card">
        <p className="tool-title">Cómo recolectar la evidencia</p>
        <p>{info.summary}</p>
        <div className="chips">
          {info.tools.map((t) =>
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
      </div>
      <div className="q-actions">
        <button className="btn primary" onClick={onNext} autoFocus>
          Comenzar dimensión
        </button>
        <span className="hint">
          o presiona <kbd>Enter ↵</kbd>
        </span>
      </div>
    </section>
  )
}
