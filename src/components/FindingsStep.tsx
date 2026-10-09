import { useState } from 'react'
import { CONTROLS } from '../data/instrument'
import { useEnter } from '../hooks'
import { fmt, prioritizedFindings, severityFor } from '../lib/scoring'
import { newId } from '../lib/storage'
import type { Evaluation, Finding } from '../types'

interface Props {
  ev: Evaluation
  onChange: (f: Finding[]) => void
  onNext: () => void
}

const EMPTY: Omit<Finding, 'id'> = { title: '', description: '', owasp: '', cvss: null, control: '', remediation: '' }

export function FindingsStep({ ev, onChange, onNext }: Props) {
  const [editing, setEditing] = useState<Finding | null>(null)
  useEnter(onNext, editing === null)

  const failing = CONTROLS.filter((c) => {
    const s = ev.answers[c.id]?.score
    return s === 0 || s === 1
  })
  const covered = new Set(ev.findings.flatMap((f) => f.control.split(/[/,\s]+/)))
  const uncovered = failing.filter((c) => !covered.has(c.id))

  const suggest = () =>
    onChange([
      ...ev.findings,
      ...uncovered.map((c) => ({
        ...EMPTY,
        id: newId(),
        title: c.statement.length > 90 ? c.statement.slice(0, 88) + '…' : c.statement,
        description: ev.answers[c.id]?.evidence ?? '',
        control: c.id,
      })),
    ])

  const save = (f: Finding) => {
    const exists = ev.findings.some((x) => x.id === f.id)
    onChange(exists ? ev.findings.map((x) => (x.id === f.id ? f : x)) : [...ev.findings, f])
    setEditing(null)
  }

  const list = prioritizedFindings(ev.findings)

  return (
    <section className="question wide">
      <p className="q-kicker">Paso final · Informe de brechas (RF-03)</p>
      <h2 className="q-title">Inventario de hallazgos priorizados</h2>
      <p className="q-help">
        Registra cada brecha con su puntaje CVSS v3.1 (consúltalo en la NVD) y la remediación recomendada. El informe las ordena por severidad. Este
        paso es opcional: puedes continuar y ver el IMS directamente.
      </p>

      {uncovered.length > 0 && (
        <div className="note row">
          <span>
            {uncovered.length} control{uncovered.length > 1 ? 'es' : ''} no cumplido{uncovered.length > 1 ? 's' : ''} o parcial
            {uncovered.length > 1 ? 'es' : ''} aún sin hallazgo asociado.
          </span>
          <button className="btn secondary sm" onClick={suggest}>
            Crear borradores de hallazgo
          </button>
        </div>
      )}

      {list.length === 0 && !editing && <p className="empty">Aún no hay hallazgos registrados.</p>}

      <ul className="finding-list">
        {list.map((f) =>
          editing?.id === f.id ? (
            <li key={f.id}>
              <FindingForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={f.id} className="finding">
              <span className={`sev sev-${severityFor(f.cvss).key}`}>
                {f.cvss === null ? '—' : fmt(f.cvss)}
                <small>{severityFor(f.cvss).label}</small>
              </span>
              <div className="finding-body">
                <strong>{f.title || 'Hallazgo sin título'}</strong>
                <span className="muted">
                  {f.control || 'Sin control'} {f.owasp && `· ${f.owasp}`}
                </span>
                {f.remediation && <span className="remed">→ {f.remediation}</span>}
              </div>
              <div className="finding-actions">
                <button className="link" onClick={() => setEditing(f)}>
                  Editar
                </button>
                <button className="link danger" onClick={() => onChange(ev.findings.filter((x) => x.id !== f.id))}>
                  Eliminar
                </button>
              </div>
            </li>
          ),
        )}
        {editing && !ev.findings.some((x) => x.id === editing.id) && (
          <li>
            <FindingForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />
          </li>
        )}
      </ul>

      {!editing && (
        <button className="btn secondary" onClick={() => setEditing({ ...EMPTY, id: newId() })}>
          + Agregar hallazgo
        </button>
      )}

      <div className="q-actions">
        <button className="btn primary" onClick={onNext} disabled={editing !== null}>
          Ver resultados del IMS
        </button>
        {!editing && (
          <span className="hint">
            o presiona <kbd>Enter ↵</kbd>
          </span>
        )}
      </div>
    </section>
  )
}

function FindingForm({ initial, onSave, onCancel }: { initial: Finding; onSave: (f: Finding) => void; onCancel: () => void }) {
  const [f, setF] = useState(initial)
  const [cvssText, setCvssText] = useState(initial.cvss === null ? '' : String(initial.cvss))
  const set = (k: keyof Finding, v: string) => setF((x) => ({ ...x, [k]: v }))

  const cvssNum = cvssText.trim() === '' ? null : Number(cvssText.replace(',', '.'))
  const cvssInvalid = cvssNum !== null && (Number.isNaN(cvssNum) || cvssNum < 0 || cvssNum > 10)
  const valid = f.title.trim() !== '' && !cvssInvalid

  return (
    <div className="finding-form">
      <label className="span2">
        Hallazgo *
        <input autoFocus value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="ej. Biblioteca JavaScript con vulnerabilidad conocida" />
      </label>
      <label>
        Control MESGE
        <select value={f.control} onChange={(e) => set('control', e.target.value)}>
          <option value="">—</option>
          {CONTROLS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id}
            </option>
          ))}
          {f.control && !CONTROLS.some((c) => c.id === f.control) && <option value={f.control}>{f.control}</option>}
        </select>
      </label>
      <label>
        CVSS v3.1 (0–10)
        <input inputMode="decimal" value={cvssText} onChange={(e) => setCvssText(e.target.value)} placeholder="ej. 9.1" />
        {cvssInvalid ? <small className="error">Debe ser un número entre 0 y 10.</small> : <small className="muted">{severityFor(cvssNum).label}</small>}
      </label>
      <label>
        Categoría OWASP
        <input value={f.owasp} onChange={(e) => set('owasp', e.target.value)} placeholder="ej. A06:2021" />
      </label>
      <label className="span2">
        Descripción técnica
        <textarea rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <label className="span2">
        Remediación priorizada
        <textarea rows={2} value={f.remediation} onChange={(e) => set('remediation', e.target.value)} />
      </label>
      <div className="span2 form-actions">
        <button className="btn primary sm" disabled={!valid} onClick={() => onSave({ ...f, cvss: cvssNum })}>
          Guardar hallazgo
        </button>
        <button className="btn ghost sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
