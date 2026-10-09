import { useState } from 'react'
import { useEnter } from '../hooks'
import type { MetaField } from '../steps'

interface Props {
  field: MetaField
  number: number
  value: string
  onChange: (v: string) => void
  onNext: () => void
}

export function MetaStep({ field, number, value, onChange, onNext }: Props) {
  const [touched, setTouched] = useState(false)
  const missing = field.required && !value.trim()

  const submit = () => {
    setTouched(true)
    if (!missing) onNext()
  }
  useEnter(submit)

  return (
    <section className="question">
      <p className="q-kicker">Datos de la evaluación</p>
      <h2 className="q-title">
        <span className="q-num">
          {number}
          <Arrow />
        </span>
        {field.question}
        {field.required && <span className="req">*</span>}
      </h2>
      <p className="q-help">{field.help}</p>
      <input
        className="big-input"
        type={field.type}
        value={value}
        placeholder={field.placeholder}
        autoFocus
        onChange={(e) => onChange(e.target.value)}
        aria-label={field.question}
      />
      {touched && missing && <p className="error">Este dato es necesario para el informe.</p>}
      <div className="q-actions">
        <button className="btn primary" onClick={submit}>
          Aceptar <Check />
        </button>
        <span className="hint">
          o presiona <kbd>Enter ↵</kbd>
        </span>
      </div>
    </section>
  )
}

export function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}
