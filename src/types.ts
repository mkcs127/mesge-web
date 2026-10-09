export type DimensionId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5'

export interface Dimension {
  id: string
  name: string
  /** Peso en el IMS, expresado como fracción (0.25 = 25 %). */
  weight: number
}

export interface Control {
  id: string
  dimension: string
  statement: string
  guide: string
  reference: string
}

/** 2 = Cumplido, 1 = Parcial, 0 = No cumplido, NE = No evaluable. */
export type Score = 2 | 1 | 0 | 'NE'

export interface Answer {
  score: Score | null
  evidence: string
}

export interface Finding {
  id: string
  title: string
  description: string
  owasp: string
  cvss: number | null
  control: string
  remediation: string
}

export interface Meta {
  institution: string
  platform: string
  date: string
  evaluator: string
}

export interface Evaluation {
  version: 1
  meta: Meta
  answers: Record<string, Answer>
  findings: Finding[]
  /** Lista de preparación marcada antes de iniciar (id → listo). */
  checklist?: Record<string, boolean>
  updatedAt: string
}
