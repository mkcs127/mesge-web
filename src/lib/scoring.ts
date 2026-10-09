import { CONTROLS, DIMENSIONS } from '../data/instrument'
import type { Answer, Dimension, Finding, Score } from '../types'

export const SCORE_LABEL: Record<string, string> = {
  '2': 'Cumplido',
  '1': 'Parcialmente cumplido',
  '0': 'No cumplido',
  NE: 'No evaluable (N/E)',
}

export function scoreLabel(score: Score | null | undefined): string {
  return score === null || score === undefined ? 'Sin responder' : SCORE_LABEL[String(score)]
}

export interface DimensionResult {
  dimension: Dimension
  evaluated: number
  notEvaluable: number
  obtained: number
  possible: number
  /** Puntaje de dimensión (0–100) o null si todos sus controles son N/E. */
  pd: number | null
  contribution: number
}

export interface Level {
  key: 'critico' | 'deficiente' | 'basico' | 'adecuado'
  label: string
  range: string
  description: string
}

export const LEVELS: Level[] = [
  { key: 'critico', label: 'Crítico', range: '0 – 25', description: 'Vulnerabilidades críticas activas. Acción inmediata requerida.' },
  { key: 'deficiente', label: 'Deficiente', range: '26 – 50', description: 'Controles insuficientes. Plan de remediación urgente en 30–90 días.' },
  { key: 'basico', label: 'Básico', range: '51 – 75', description: 'Controles mínimos presentes. Mejoras en áreas de mayor riesgo.' },
  { key: 'adecuado', label: 'Adecuado', range: '76 – 100', description: 'Controles implementados. Mantener ciclo de revisión periódica.' },
]

/** Misma regla que la hoja CÁLCULO IMS: <=25 Crítico, <=50 Deficiente, <=75 Básico, resto Adecuado. */
export function levelFor(ims: number): Level {
  if (ims <= 25) return LEVELS[0]
  if (ims <= 50) return LEVELS[1]
  if (ims <= 75) return LEVELS[2]
  return LEVELS[3]
}

export interface ImsResult {
  dimensions: DimensionResult[]
  ims: number
  level: Level
  /** true si alguna dimensión quedó completa en N/E y su peso se redistribuyó. */
  reweighted: boolean
  answered: number
  total: number
}

export function computeIms(answers: Record<string, Answer>): ImsResult {
  const dimensions = DIMENSIONS.map((dimension): DimensionResult => {
    const scores = CONTROLS.filter((c) => c.dimension === dimension.id).map((c) => answers[c.id]?.score ?? null)
    const numeric = scores.filter((s): s is 0 | 1 | 2 => typeof s === 'number')
    const obtained = numeric.reduce<number>((a, b) => a + b, 0)
    const possible = numeric.length * 2
    const pd = possible > 0 ? (obtained / possible) * 100 : null
    return {
      dimension,
      evaluated: numeric.length,
      notEvaluable: scores.filter((s) => s === 'NE').length,
      obtained,
      possible,
      pd,
      contribution: pd === null ? 0 : pd * dimension.weight,
    }
  })

  // IMS = Σ(PDi × Peso_i). Si una dimensión no tiene controles evaluables, se excluye y
  // los pesos restantes se normalizan para mantener la escala 0–100.
  const scoredWeight = dimensions.filter((d) => d.pd !== null).reduce((a, d) => a + d.dimension.weight, 0)
  const raw = dimensions.reduce((a, d) => a + d.contribution, 0)
  const reweighted = scoredWeight > 0 && Math.abs(scoredWeight - 1) > 1e-9
  const ims = scoredWeight > 0 ? raw / scoredWeight : 0
  if (reweighted) {
    for (const d of dimensions) d.contribution = d.pd === null ? 0 : (d.pd * d.dimension.weight) / scoredWeight
  }

  const answered = CONTROLS.filter((c) => answers[c.id]?.score != null).length
  return { dimensions, ims, level: levelFor(ims), reweighted, answered, total: CONTROLS.length }
}

export interface Severity {
  key: 'critica' | 'alta' | 'media' | 'baja' | 'ninguna' | 'sin'
  label: string
}

/** Rangos cualitativos de CVSS v3.1. */
export function severityFor(cvss: number | null): Severity {
  if (cvss === null || Number.isNaN(cvss)) return { key: 'sin', label: 'Sin CVSS' }
  if (cvss >= 9) return { key: 'critica', label: 'Crítico' }
  if (cvss >= 7) return { key: 'alta', label: 'Alto' }
  if (cvss >= 4) return { key: 'media', label: 'Medio' }
  if (cvss > 0) return { key: 'baja', label: 'Bajo' }
  return { key: 'ninguna', label: 'Ninguna' }
}

/** Brechas priorizadas por severidad CVSS v3.1 (RF-03); sin CVSS al final. */
export function prioritizedFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => (b.cvss ?? -1) - (a.cvss ?? -1))
}

export function fmt(n: number, digits = 1): string {
  return n.toLocaleString('es-CL', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

const SHORT_NAMES: Record<string, string> = {
  D1: 'Autenticación',
  D2: 'Componentes',
  D3: 'Transporte TLS',
  D4: 'Configuración web',
  D5: 'Cumplimiento normativo',
}

export function shortName(dimensionId: string): string {
  return SHORT_NAMES[dimensionId] ?? dimensionId
}
