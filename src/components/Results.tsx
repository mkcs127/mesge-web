import { useState } from 'react'
import { CONTROLS } from '../data/instrument'
import { computeIms, fmt, LEVELS, levelFor, prioritizedFindings, scoreLabel, severityFor, shortName } from '../lib/scoring'
import { downloadJson } from '../lib/storage'
import { stepIndexOf, stepIndexOfControl } from '../steps'
import type { Evaluation } from '../types'

interface Props {
  ev: Evaluation
  onGoTo: (step: number) => void
  onReset: () => void
}

export function Results({ ev, onGoTo, onReset }: Props) {
  const r = computeIms(ev.answers)
  const [busy, setBusy] = useState(false)
  const findings = prioritizedFindings(ev.findings)
  const pending = CONTROLS.filter((c) => ev.answers[c.id]?.score == null)

  const exportPdf = async () => {
    setBusy(true)
    try {
      // Se carga bajo demanda; el PDF se construye en el navegador.
      const { generatePdf } = await import('../lib/pdf')
      generatePdf(ev)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="results">
      <p className="q-kicker">Resultado de la evaluación</p>
      <h2 className="results-title">{ev.meta.institution || 'Establecimiento sin nombre'}</h2>
      <p className="muted">
        {ev.meta.platform || 'Plataforma no indicada'} · Análisis del {formatDate(ev.meta.date)}
        {ev.meta.evaluator && ` · ${ev.meta.evaluator}`}
      </p>

      {pending.length > 0 && (
        <div className="note row warn">
          <span>
            Faltan {pending.length} control{pending.length > 1 ? 'es' : ''} por responder; el IMS se calcula solo con los respondidos.
          </span>
          <button className="btn secondary sm" onClick={() => onGoTo(stepIndexOfControl(pending[0].id))}>
            Ir al primero pendiente
          </button>
        </div>
      )}

      <div className="score-card">
        <Gauge value={r.ims} tone={r.level.key} />
        <div className="score-text">
          <span className="score-label">Índice de Madurez de Seguridad</span>
          <span className={`level-pill lvl-${r.level.key}`}>{r.level.label}</span>
          <p>{r.level.description}</p>
          <div className="actions">
            <button className="btn primary" onClick={exportPdf} disabled={busy}>
              {busy ? 'Generando…' : 'Descargar informe PDF'}
            </button>
            <button className="btn secondary" onClick={() => downloadJson(ev)}>
              Exportar respuestas (.json)
            </button>
          </div>
        </div>
      </div>

      <h3 className="section-title">Puntaje por dimensión</h3>
      <div className="dims">
        {r.dimensions.map((d) => {
          const tone = d.pd === null ? 'ne' : levelFor(d.pd).key
          return (
            <button key={d.dimension.id} className="dim-row" onClick={() => onGoTo(stepIndexOfControl(`${d.dimension.id}-C1`) - 1)}>
              <span className="dim-name">
                <span>
                  <strong>{d.dimension.id}</strong> {shortName(d.dimension.id)}
                </span>
                <small>
                  Peso {Math.round(d.dimension.weight * 100)} % · {d.obtained}/{d.possible} pts
                  {d.notEvaluable > 0 && ` · ${d.notEvaluable} N/E`}
                </small>
              </span>
              <span className="bar">
                <span className={`bar-fill lvl-${tone}`} style={{ width: `${d.pd ?? 0}%` }} />
              </span>
              <span className="dim-val">{d.pd === null ? 'N/E' : fmt(d.pd)}</span>
              <span className="dim-contrib">+{fmt(d.contribution, 2)}</span>
            </button>
          )
        })}
      </div>
      <p className="formula">
        IMS = Σ(PD<sub>i</sub> × Peso<sub>i</sub>), donde PD<sub>i</sub> = puntos obtenidos / puntos posibles × 100. Los controles N/E se excluyen del
        denominador.
        {r.reweighted && ' Una o más dimensiones quedaron sin controles evaluables; su peso se redistribuyó proporcionalmente.'}
      </p>

      <div className="levels">
        {LEVELS.map((l) => (
          <div key={l.key} className={`level-cell ${l.key === r.level.key ? 'active' : ''}`}>
            <span className={`dot lvl-${l.key}`} />
            <strong>{l.label}</strong>
            <small>{l.range}</small>
          </div>
        ))}
      </div>

      <h3 className="section-title">
        Brechas priorizadas por CVSS
        <button className="link" onClick={() => onGoTo(stepIndexOf('findings'))}>
          Editar hallazgos
        </button>
      </h3>
      {findings.length === 0 ? (
        <p className="empty">No se registraron hallazgos. Puedes agregarlos para obtener el informe de brechas priorizado.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Hallazgo</th>
                <th>CVSS</th>
                <th>Control</th>
                <th>Remediación</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f, i) => (
                <tr key={f.id}>
                  <td>{i + 1}</td>
                  <td>
                    <strong>{f.title}</strong>
                    {f.owasp && <small className="muted"> {f.owasp}</small>}
                  </td>
                  <td>
                    <span className={`sev-tag sev-${severityFor(f.cvss).key}`}>
                      {f.cvss === null ? '—' : fmt(f.cvss)} {severityFor(f.cvss).label}
                    </span>
                  </td>
                  <td className="nowrap">{f.control}</td>
                  <td>{f.remediation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="section-title">Detalle de controles</h3>
      <div className="table-wrap">
        <table className="controls-table">
          <tbody>
            {CONTROLS.map((c) => {
              const a = ev.answers[c.id]
              return (
                <tr key={c.id} className="clickable" onClick={() => onGoTo(stepIndexOfControl(c.id))} title="Editar respuesta">
                  <td className="nowrap">
                    <strong>{c.id}</strong>
                  </td>
                  <td>{c.statement}</td>
                  <td className="nowrap">
                    <span className={`state st-${a?.score ?? 'none'}`}>{scoreLabel(a?.score)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="footer-actions">
        <button className="link" onClick={() => onGoTo(1)}>
          Revisar desde el inicio
        </button>
        <button className="link danger" onClick={onReset}>
          Borrar y comenzar nueva evaluación
        </button>
      </div>
      <p className="muted small">
        MESGE diagnostica la postura observable externamente mediante análisis pasivo. No certifica cumplimiento normativo ni reemplaza una auditoría
        o prueba de penetración autorizada.
      </p>
    </section>
  )
}

function Gauge({ value, tone }: { value: number; tone: string }) {
  const R = 80
  const C = Math.PI * R
  const pct = Math.max(0, Math.min(100, value)) / 100
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 116" role="img" aria-label={`IMS ${fmt(value)} de 100`}>
        <path d="M20 100 A80 80 0 0 1 180 100" className="gauge-track" />
        <path d="M20 100 A80 80 0 0 1 180 100" className={`gauge-fill lvl-${tone}`} strokeDasharray={`${C * pct} ${C}`} />
      </svg>
      <div className="gauge-value">
        <strong>{fmt(value)}</strong>
        <span>de 100</span>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}
