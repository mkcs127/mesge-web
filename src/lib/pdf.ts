import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CONTROLS, DIMENSIONS } from '../data/instrument'
import type { Evaluation } from '../types'
import { computeIms, fmt, shortName, LEVELS, prioritizedFindings, scoreLabel, severityFor } from './scoring'
import { slug } from './storage'

type RGB = [number, number, number]

const INK: RGB = [22, 27, 45]
const MUTED: RGB = [100, 108, 128]
const ACCENT: RGB = [49, 46, 129]
const LEVEL_RGB: Record<string, RGB> = {
  critico: [190, 30, 45],
  deficiente: [214, 98, 20],
  basico: [180, 140, 0],
  adecuado: [22, 128, 72],
}
const SEVERITY_RGB: Record<string, RGB> = {
  critica: [190, 30, 45],
  alta: [214, 98, 20],
  media: [180, 140, 0],
  baja: [60, 110, 180],
  ninguna: [120, 120, 120],
  sin: [120, 120, 120],
}

// Las fuentes estándar de PDF solo cubren Latin-1: se reemplazan símbolos fuera de ese rango.
function t(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/[—–]/g, '-')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/→/g, '->')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/Σ/g, 'Suma ')
    .replace(/[^\t\n\r -ÿ]/g, '')
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

export function generatePdf(ev: Evaluation): void {
  buildPdf(ev).save(`Informe_MESGE_${slug(ev.meta.institution || 'evaluacion')}_${ev.meta.date}.pdf`)
}

export function buildPdf(ev: Evaluation): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 16
  const result = computeIms(ev.answers)
  const levelRgb = LEVEL_RGB[result.level.key]

  // ---------- Encabezado ----------
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, W, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('MESGE', M, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.text(t('Matriz de Evaluación de Seguridad para Gestión Escolar'), M, 23)
  doc.setFontSize(8.5)
  doc.text(t('Informe de autoevaluación — Índice de Madurez de Seguridad (IMS)'), M, 28.5)

  // ---------- Datos de la evaluación ----------
  autoTable(doc, {
    startY: 40,
    margin: { left: M, right: M },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.4, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44, textColor: MUTED } },
    body: [
      ['Establecimiento', t(ev.meta.institution) || '-'],
      ['Plataforma evaluada', t(ev.meta.platform) || '-'],
      ['Fecha de análisis', formatDate(ev.meta.date)],
      ['Evaluador', t(ev.meta.evaluator) || '-'],
      ['Metodología', 'Análisis pasivo - OWASP OTG-INFO / OTG-CONFIG'],
      ['Instrumento', 'MESGE v1.0'],
    ],
  })

  // ---------- Resultado global ----------
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  doc.setDrawColor(...levelRgb)
  doc.setLineWidth(0.6)
  doc.roundedRect(M, y, W - 2 * M, 30, 3, 3, 'S')
  doc.setTextColor(...levelRgb)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.text(fmt(result.ims), M + 8, y + 17)
  const imsWidth = doc.getTextWidth(fmt(result.ims))
  doc.setFontSize(11)
  doc.setTextColor(...MUTED)
  doc.text('/ 100', M + 10 + imsWidth, y + 17)
  doc.setFontSize(8)
  doc.text('IMS GLOBAL', M + 8, y + 24)

  doc.setFillColor(...levelRgb)
  doc.roundedRect(M + 62, y + 7, 34, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(t(result.level.label.toUpperCase()), M + 79, y + 12.5, { align: 'center' })
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(doc.splitTextToSize(t(result.level.description), W - 2 * M - 110), M + 102, y + 11)
  doc.setTextColor(...MUTED)
  doc.setFontSize(7.5)
  doc.text(`Controles respondidos: ${result.answered} de ${result.total}`, M + 62, y + 24)
  y += 36

  // ---------- Barras por dimensión ----------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(t('Puntaje por dimensión'), M, y)
  y += 5
  const barX = M + 62
  const barW = W - M - barX - 16
  for (const d of result.dimensions) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...INK)
    doc.text(t(`${d.dimension.id} - ${shortName(d.dimension.id)}`), M, y + 3.6)
    doc.setFillColor(232, 234, 242)
    doc.roundedRect(barX, y, barW, 5, 1.2, 1.2, 'F')
    if (d.pd !== null && d.pd > 0) {
      doc.setFillColor(...LEVEL_RGB[levelKey(d.pd)])
      doc.roundedRect(barX, y, Math.max(2.4, (barW * d.pd) / 100), 5, 1.2, 1.2, 'F')
    }
    doc.setFont('helvetica', 'bold')
    doc.text(d.pd === null ? 'N/E' : fmt(d.pd), W - M, y + 3.8, { align: 'right' })
    y += 7.5
  }

  // ---------- Tabla de cálculo ----------
  autoTable(doc, {
    startY: y + 2,
    margin: { left: M, right: M },
    headStyles: { fillColor: ACCENT, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 1.6 },
    head: [['Dimensión', 'Peso', 'Evaluados', 'N/E', 'Obtenidos', 'Posibles', 'PD', 'Contribución']],
    body: [
      ...result.dimensions.map((d) => [
        t(`${d.dimension.id} - ${shortName(d.dimension.id)}`),
        `${Math.round(d.dimension.weight * 100)}%`,
        d.evaluated,
        d.notEvaluable,
        d.obtained,
        d.possible,
        d.pd === null ? 'N/E' : fmt(d.pd),
        fmt(d.contribution, 2),
      ]),
      [{ content: 'IMS GLOBAL', colSpan: 7, styles: { fontStyle: 'bold', halign: 'right' } }, { content: fmt(result.ims, 2), styles: { fontStyle: 'bold' } }],
    ],
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  const formula =
    'IMS = Suma(PDi x Peso_i), con PDi = puntos obtenidos / puntos posibles x 100. Los controles N/E se excluyen del denominador.' +
    (result.reweighted ? ' Una o más dimensiones no tuvieron controles evaluables; sus pesos se redistribuyeron proporcionalmente.' : '')
  doc.text(doc.splitTextToSize(formula, W - 2 * M), M, y)

  // ---------- Tabla de niveles ----------
  autoTable(doc, {
    startY: y + 7,
    margin: { left: M, right: M },
    headStyles: { fillColor: [90, 96, 120], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 1.4 },
    head: [['Rango IMS', 'Nivel', 'Interpretación']],
    body: LEVELS.map((l) => [l.range, t(l.label), t(l.description)]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.textColor = LEVEL_RGB[LEVELS[data.row.index].key]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ---------- Brechas priorizadas ----------
  const findings = prioritizedFindings(ev.findings)
  doc.addPage()
  sectionTitle(doc, 'Brechas priorizadas por severidad (CVSS v3.1)', M, 20)
  if (findings.length > 0) {
    autoTable(doc, {
      startY: 25,
      margin: { left: M, right: M },
      headStyles: { fillColor: ACCENT, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.6, valign: 'top' },
      columnStyles: { 0: { cellWidth: 7 }, 1: { cellWidth: 48 }, 2: { cellWidth: 13 }, 3: { cellWidth: 17 }, 4: { cellWidth: 18 } },
      head: [['#', 'Hallazgo', 'CVSS', 'Severidad', 'Control', 'Remediación priorizada']],
      body: findings.map((f, i) => [
        i + 1,
        t(f.title) + (f.owasp ? `\n(${t(f.owasp)})` : ''),
        f.cvss === null ? '-' : fmt(f.cvss),
        t(severityFor(f.cvss).label),
        t(f.control),
        t(f.remediation) || '-',
      ]),
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = SEVERITY_RGB[severityFor(findings[data.row.index].cvss).key]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text('No se registraron hallazgos con CVSS. Ver detalle de controles no cumplidos a continuación.', M, 28)
  }

  // ---------- Detalle de controles ----------
  y = findings.length > 0 ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10 : 38
  sectionTitle(doc, 'Detalle de controles evaluados', M, y)
  const rows: (string | { content: string; colSpan: number; styles: object })[][] = []
  for (const dim of DIMENSIONS) {
    rows.push([{ content: t(`${dim.id} - ${dim.name} (Peso ${Math.round(dim.weight * 100)}%)`), colSpan: 4, styles: { fillColor: [232, 234, 242], fontStyle: 'bold' } }])
    for (const c of CONTROLS.filter((c) => c.dimension === dim.id)) {
      const a = ev.answers[c.id]
      rows.push([c.id, t(c.statement) + `\nRef.: ${t(c.reference)}`, t(scoreLabel(a?.score)), t(a?.evidence) || '-'])
    }
  }
  autoTable(doc, {
    startY: y + 5,
    margin: { left: M, right: M },
    headStyles: { fillColor: ACCENT, fontSize: 8 },
    styles: { fontSize: 7.2, cellPadding: 1.6, valign: 'top' },
    columnStyles: { 0: { cellWidth: 14, fontStyle: 'bold' }, 1: { cellWidth: 72 }, 2: { cellWidth: 22 } },
    head: [['ID', 'Control', 'Estado', 'Evidencia registrada']],
    body: rows,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const v = String(data.cell.raw)
        if (v.startsWith('No cumplido')) data.cell.styles.textColor = LEVEL_RGB.critico
        else if (v.startsWith('Parcial')) data.cell.styles.textColor = LEVEL_RGB.deficiente
        else if (v.startsWith('Cumplido')) data.cell.styles.textColor = LEVEL_RGB.adecuado
        else data.cell.styles.textColor = MUTED
      }
    },
  })

  // ---------- Limitaciones ----------
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  if (y > 250) {
    doc.addPage()
    y = 20
  }
  sectionTitle(doc, 'Alcance y limitaciones', M, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...INK)
  const limits =
    'MESGE diagnostica la postura de seguridad observable externamente mediante análisis pasivo, sin credenciales ni explotación. ' +
    'No certifica cumplimiento normativo (no es una auditoría formal), no evalúa controles internos de red, gestión de identidades o políticas organizacionales, ' +
    'no detecta vulnerabilidades que requieran autenticación o explotación activa y no reemplaza una prueba de penetración con autorización expresa.'
  doc.text(doc.splitTextToSize(limits, W - 2 * M), M, y + 6)

  // ---------- Pie de página ----------
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    const H = doc.internal.pageSize.getHeight()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(t('MESGE v1.0 · Informe generado localmente en el navegador; los datos no se enviaron a ningún servidor.'), M, H - 8)
    doc.text(`Página ${i} de ${pages}`, W - M, H - 8, { align: 'right' })
  }

  return doc
}

function sectionTitle(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...INK)
  doc.text(t(text), x, y)
}


function levelKey(pd: number): string {
  if (pd <= 25) return 'critico'
  if (pd <= 50) return 'deficiente'
  if (pd <= 75) return 'basico'
  return 'adecuado'
}
