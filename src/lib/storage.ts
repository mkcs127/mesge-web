import type { Evaluation } from '../types'

// Todo se guarda solo en el navegador del usuario (localStorage). Nada se envía a un servidor.
const KEY = 'mesge:evaluation:v1'

export function emptyEvaluation(): Evaluation {
  return {
    version: 1,
    meta: { institution: '', platform: '', date: new Date().toISOString().slice(0, 10), evaluator: '' },
    answers: {},
    findings: [],
    updatedAt: new Date().toISOString(),
  }
}

export function loadDraft(): Evaluation | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseEvaluation(raw) : null
  } catch {
    return null
  }
}

export function saveDraft(ev: Evaluation): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ev))
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando en memoria */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignorar */
  }
}

export function parseEvaluation(raw: string): Evaluation | null {
  try {
    const data = JSON.parse(raw)
    if (data?.version !== 1 || typeof data.meta !== 'object' || typeof data.answers !== 'object') return null
    return { ...emptyEvaluation(), ...data, findings: Array.isArray(data.findings) ? data.findings : [] }
  } catch {
    return null
  }
}

export function downloadJson(ev: Evaluation): void {
  const blob = new Blob([JSON.stringify(ev, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `MESGE_${slug(ev.meta.institution || 'evaluacion')}_${ev.meta.date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}
