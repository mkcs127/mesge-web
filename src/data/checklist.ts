// Lista de preparación que el evaluador confirma antes de iniciar la evaluación.
import type { Evaluation } from '../types'
import type { Tool } from './howto'

export interface ChecklistItem {
  id: string
  group: string
  title: string
  description: string
  required: boolean
  links?: Tool[]
  code?: string
  /** 'url' valida la dirección de la plataforma en lugar de un check manual. */
  kind?: 'url'
}

export const CHECKLIST: ChecklistItem[] = [
  {
    id: 'url',
    group: 'Plataforma a evaluar',
    title: 'URL pública de la plataforma',
    description:
      'La dirección con la que se accede a la plataforma de gestión escolar desde internet (la página de inicio de sesión). Se usará en SSL Labs, securityheaders.com y en los comandos. Más adelante podrás anonimizarla para el informe.',
    required: true,
    kind: 'url',
  },
  {
    id: 'browser',
    group: 'Equipo',
    title: 'Microsoft Edge o Google Chrome actualizado',
    description:
      'En un PC con Windows. Para comprobar la versión: menú ⋯ (arriba a la derecha) → Configuración → "Acerca de Microsoft Edge" (o "Información de Chrome"); se actualiza automáticamente.',
    required: true,
  },
  {
    id: 'devtools',
    group: 'Equipo',
    title: 'Las herramientas de desarrollador (F12) se abren',
    description:
      'Pruébalo ahora: presiona F12 en esta misma página. Debe abrirse un panel lateral o inferior; ciérralo con F12. En equipos administrados por TI pueden estar bloqueadas: si no se abren, solicita que las habiliten.',
    required: true,
  },
  {
    id: 'wappalyzer',
    group: 'Equipo',
    title: 'Extensión Wappalyzer instalada y fijada',
    description:
      'Instálala desde la tienda de complementos de tu navegador. Luego haz clic en el ícono de pieza de puzle junto a la barra de direcciones y fíjala. Pruébala en cualquier sitio: debe listar tecnologías.',
    required: true,
    links: [{ label: 'Descargar Wappalyzer', url: 'https://www.wappalyzer.com/apps/' }],
  },
  {
    id: 'ssllabs',
    group: 'Sitios web de análisis',
    title: 'Qualys SSL Labs abre correctamente',
    description: 'Abre el enlace y confirma que la página carga. Algunas redes escolares o corporativas bloquean estos sitios.',
    required: true,
    links: [{ label: 'Abrir SSL Labs', url: 'https://www.ssllabs.com/ssltest/' }],
  },
  {
    id: 'headers',
    group: 'Sitios web de análisis',
    title: 'securityheaders.com abre correctamente',
    description: 'Abre el enlace y confirma que la página carga.',
    required: true,
    links: [{ label: 'Abrir securityheaders.com', url: 'https://securityheaders.com' }],
  },
  {
    id: 'nvd',
    group: 'Sitios web de análisis',
    title: 'Buscador de vulnerabilidades NIST NVD abre correctamente',
    description: 'Se usa para buscar CVEs de cada componente detectado (dimensión D2).',
    required: true,
    links: [{ label: 'Abrir NVD', url: 'https://nvd.nist.gov/vuln/search' }],
  },
  {
    id: 'cmd',
    group: 'Opcional',
    title: 'Ventana de comandos con curl.exe',
    description:
      'Permite verificar headers de forma alternativa. Presiona la tecla Windows, escribe cmd y presiona Enter; luego ejecuta el comando. Si muestra un número de versión, está listo (viene incluido en Windows 10 y 11).',
    required: false,
    code: 'curl.exe --version',
  },
  {
    id: 'time',
    group: 'Opcional',
    title: 'Tiempo disponible',
    description: 'La aplicación completa toma entre 6 y 8 horas. Puedes pausar: el avance queda guardado en este navegador y puedes retomarlo.',
    required: false,
  },
  {
    id: 'folder',
    group: 'Organización',
    title: 'Carpeta para guardar las evidencias',
    description:
      'Crea una carpeta, por ejemplo en Documentos: "MESGE_Evidencias_<establecimiento>_<fecha>". Ahí guardarás capturas (Win + Shift + S) y los reportes PDF de SSL Labs y securityheaders.com.',
    required: true,
  },
  {
    id: 'auth',
    group: 'Compromiso',
    title: 'Cuento con autorización y aplicaré solo análisis pasivo',
    description:
      'El establecimiento autorizó esta evaluación. Me limitaré a observar la información que el sitio entrega a cualquier visitante: no iniciaré sesión con credenciales ajenas, no probaré ataques ni intentaré forzar el sistema.',
    required: true,
  },
]

/** Acepta "dominio.cl" o "https://dominio.cl/ruta"; exige un nombre de host con dominio. */
export function normalizePlatformUrl(value: string): string | null {
  const v = value.trim()
  if (!v || /\s/.test(v)) return null
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(v) ? v : `https://${v}`)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return null
    return url.origin + (url.pathname === '/' ? '' : url.pathname)
  } catch {
    return null
  }
}

export function checklistReady(ev: Evaluation): boolean {
  return CHECKLIST.filter((i) => i.required).every((i) => ev.checklist?.[i.id])
}
