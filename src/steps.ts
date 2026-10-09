import { CONTROLS, DIMENSIONS } from './data/instrument'
import { checklistReady } from './data/checklist'
import type { Control, Dimension, Evaluation, Meta } from './types'

export interface MetaField {
  key: keyof Meta
  question: string
  help: string
  placeholder: string
  type: 'text' | 'date'
  required: boolean
}

export const META_FIELDS: MetaField[] = [
  {
    key: 'institution',
    question: '¿Qué establecimiento se está evaluando?',
    help: 'Puedes usar una descripción anonimizada, por ejemplo: "Establecimiento A — Comuna X".',
    placeholder: 'Nombre o descripción del establecimiento',
    type: 'text',
    required: true,
  },
  {
    key: 'platform',
    question: '¿Cuál es la plataforma web de gestión escolar evaluada?',
    help: 'Dominio o nombre de la plataforma. Solo queda registrado en tu informe, no se consulta ni se envía a ningún lado.',
    placeholder: 'ej. plataforma.colegio.cl',
    type: 'text',
    required: true,
  },
  {
    key: 'date',
    question: '¿En qué fecha se realizó el análisis?',
    help: 'Fecha en que se recolectó la evidencia (reportes de SSL Labs, securityheaders.com, etc.).',
    placeholder: '',
    type: 'date',
    required: true,
  },
  {
    key: 'evaluator',
    question: '¿Quién aplica el instrumento?',
    help: 'Nombre y cargo del evaluador. Opcional.',
    placeholder: 'ej. Nombre Apellido — Encargado TI',
    type: 'text',
    required: false,
  },
]

/** Herramientas y paso del manual asociados a cada dimensión (hoja INSTRUCCIONES). */
export const DIMENSION_TOOLS: Record<string, { summary: string; tools: { label: string; url?: string }[] }> = {
  D1: {
    summary: 'Revisa el formulario de login con el inspector del navegador (F12) y los atributos de las cookies de sesión.',
    tools: [{ label: 'DevTools del navegador (F12)' }, { label: 'securityheaders.com', url: 'https://securityheaders.com' }],
  },
  D2: {
    summary: 'Identifica componentes y versiones con Wappalyzer o el header Server, y busca CVEs para cada versión en la NVD.',
    tools: [{ label: 'Wappalyzer', url: 'https://www.wappalyzer.com' }, { label: 'NIST NVD', url: 'https://nvd.nist.gov/vuln/search' }, { label: 'curl.exe -I https://[dominio] (cmd)' }],
  },
  D3: {
    summary: 'Ejecuta un análisis en Qualys SSL Labs y archiva el reporte con fecha como evidencia.',
    tools: [{ label: 'Qualys SSL Labs', url: 'https://www.ssllabs.com/ssltest' }],
  },
  D4: {
    summary: 'Analiza la URL en securityheaders.com y registra qué headers de seguridad están presentes o ausentes.',
    tools: [{ label: 'securityheaders.com', url: 'https://securityheaders.com' }],
  },
  D5: {
    summary: 'Navega el sitio público sin autenticarte y busca política de privacidad, mensajes de error y canal de reporte de incidentes.',
    tools: [{ label: 'Navegación pública del sitio' }],
  },
}

/** Controles cuyo estado depende de otro (D5-C2 es N/E si D5-C1 es N/E). */
export const DEPENDS_ON: Record<string, string> = { 'D5-C2': 'D5-C1' }

export type Step =
  | { kind: 'welcome' }
  | { kind: 'checklist' }
  | { kind: 'meta'; field: MetaField; number: number }
  | { kind: 'dimension'; dimension: Dimension; index: number }
  | { kind: 'control'; control: Control; dimension: Dimension; indexInDim: number; countInDim: number; number: number }
  | { kind: 'findings' }
  | { kind: 'results' }

function buildSteps(): Step[] {
  const steps: Step[] = [{ kind: 'welcome' }, { kind: 'checklist' }]
  let n = 1
  for (const field of META_FIELDS) steps.push({ kind: 'meta', field, number: n++ })
  DIMENSIONS.forEach((dimension, index) => {
    steps.push({ kind: 'dimension', dimension, index })
    const controls = CONTROLS.filter((c) => c.dimension === dimension.id)
    controls.forEach((control, i) =>
      steps.push({ kind: 'control', control, dimension, indexInDim: i, countInDim: controls.length, number: n++ }),
    )
  })
  steps.push({ kind: 'findings' }, { kind: 'results' })
  return steps
}

export const STEPS = buildSteps()

export function stepIndexOfControl(id: string): number {
  return STEPS.findIndex((s) => s.kind === 'control' && s.control.id === id)
}

export function stepIndexOf(kind: Step['kind']): number {
  return STEPS.findIndex((s) => s.kind === kind)
}

/** Paso donde retomar un borrador: primer dato requerido o control sin responder. */
export function resumeStep(ev: Evaluation): number {
  const idx = STEPS.findIndex(
    (s) =>
      (s.kind === 'checklist' && !checklistReady(ev)) ||
      (s.kind === 'meta' && s.field.required && !ev.meta[s.field.key]) ||
      (s.kind === 'control' && ev.answers[s.control.id]?.score == null),
  )
  return idx === -1 ? stepIndexOf('results') : idx
}
