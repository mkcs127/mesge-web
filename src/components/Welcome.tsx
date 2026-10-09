import { useRef, useState } from 'react'
import { CONTROLS, DIMENSIONS } from '../data/instrument'
import { useEnter } from '../hooks'
import { parseEvaluation } from '../lib/storage'
import type { Evaluation } from '../types'

interface Props {
  hasDraft: boolean
  draftLabel?: string
  inProgress: boolean
  onStart: () => void
  onResume: () => void
  onContinue: () => void
  onImport: (ev: Evaluation) => void
}

export function Welcome({ hasDraft, draftLabel, inProgress, onStart, onResume, onContinue, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  useEnter(inProgress ? onContinue : onStart)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    // FileReader lee el archivo en el propio navegador; no hay carga a servidor.
    const reader = new FileReader()
    reader.onload = () => {
      const ev = parseEvaluation(String(reader.result))
      if (ev) onImport(ev)
      else setError('El archivo no corresponde a una evaluación MESGE válida.')
    }
    reader.readAsText(file)
  }

  return (
    <section className="welcome">
      <p className="eyebrow">Instrumento de autoevaluación de seguridad web · v1.0</p>
      <h1 className="hero-title">MESGE</h1>
      <p className="hero-sub">Matriz de Evaluación de Seguridad para Gestión Escolar</p>
      <p className="lead">
        Diagnostica la postura de seguridad de la plataforma web de gestión escolar de tu establecimiento frente a las Leyes 21.663, 19.628 y
        21.719, ISO/IEC 27001:2022 y CIS Controls v8.1 IG1. Responde una pregunta a la vez y obtén el <strong>Índice de Madurez de Seguridad (IMS)</strong>{' '}
        con un informe PDF.
      </p>

      <ul className="facts">
        <li>
          <strong>{CONTROLS.length}</strong>
          <span>controles en {DIMENSIONS.length} dimensiones</span>
        </li>
        <li>
          <strong>0–100</strong>
          <span>índice ponderado de madurez</span>
        </li>
        <li>
          <strong>100 %</strong>
          <span>procesado en tu navegador</span>
        </li>
      </ul>

      <div className="actions">
        {inProgress ? (
          <button className="btn primary lg" onClick={onContinue}>
            Continuar evaluación <kbd>Enter ↵</kbd>
          </button>
        ) : (
          <button className="btn primary lg" onClick={onStart}>
            Comenzar evaluación <kbd>Enter ↵</kbd>
          </button>
        )}
        {hasDraft && (
          <button className="btn secondary lg" onClick={onResume}>
            Retomar borrador{draftLabel ? `: ${draftLabel.slice(0, 32)}${draftLabel.length > 32 ? '…' : ''}` : ''}
          </button>
        )}
      </div>
      <div className="actions subtle">
        <button className="link" onClick={() => fileRef.current?.click()}>
          Importar evaluación (.json)
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      {error && <p className="error">{error}</p>}

      <p className="prep-note">
        Antes de comenzar verificarás que tienes todo listo: la URL de la plataforma, el navegador, la extensión Wappalyzer y acceso a los sitios de
        análisis. Tus respuestas se guardan solo en este navegador y no se envían a ningún servidor.
      </p>
    </section>
  )
}
