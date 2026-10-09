// Guías "¿Cómo lo hago?" para evaluadores con poca experiencia técnica.
// Formato de texto: **negrita** y `código` se renderizan en la interfaz.
import type { Score } from '../types'

export interface Tool {
  label: string
  url?: string
}

export interface HowToStep {
  text: string
  /** Comando o texto para copiar (opcional). */
  code?: string
}

export interface HowTo {
  time: string
  tools: Tool[]
  steps: HowToStep[]
  lookFor?: string[]
  decide: { score: Score; text: string }[]
  evidence: string
  note?: string
}

const T = {
  chrome: { label: 'Microsoft Edge o Google Chrome' },
  devtools: { label: 'Herramientas de desarrollador (F12)' },
  wappalyzer: { label: 'Extensión Wappalyzer', url: 'https://www.wappalyzer.com/apps/' },
  nvd: { label: 'NIST NVD', url: 'https://nvd.nist.gov/vuln/search' },
  eol: { label: 'endoflife.date', url: 'https://endoflife.date' },
  ssllabs: { label: 'Qualys SSL Labs', url: 'https://www.ssllabs.com/ssltest/' },
  headers: { label: 'securityheaders.com', url: 'https://securityheaders.com' },
  terminal: { label: 'Símbolo del sistema / PowerShell (opcional)' },
} satisfies Record<string, Tool>

const OPEN_CMD = 'Abre la ventana de comandos: presiona la tecla **Windows**, escribe `cmd` y presiona Enter (también sirve **PowerShell**).'
const OPEN_CMD_LOWER = 'abre la ventana de comandos (tecla **Windows** → escribe `cmd` → Enter).'

const NE_PASSIVE = 'Solo si no es posible verificarlo sin iniciar sesión ni realizar acciones fuera del análisis pasivo. Explica el motivo.'

// ---------- Plantillas compartidas ----------

function cookieHowTo(attr: 'Secure' | 'HttpOnly' | 'SameSite'): HowTo {
  const lookFor: Record<typeof attr, string[]> = {
    Secure: [
      'La columna **Secure** debe tener un check (✓) en cada cookie de sesión.',
      'En los encabezados, cada línea `Set-Cookie` de sesión debe incluir la palabra `Secure`.',
    ],
    HttpOnly: [
      'La columna **HttpOnly** debe tener un check (✓) en cada cookie de sesión.',
      'En los encabezados, cada línea `Set-Cookie` de sesión debe incluir `HttpOnly`.',
    ],
    SameSite: [
      'La columna **SameSite** debe decir `Strict` o `Lax`. Si está vacía o dice `None`, no cuenta.',
      'En los encabezados, cada `Set-Cookie` de sesión debe incluir `SameSite=Strict` o `SameSite=Lax`.',
    ],
  }
  return {
    time: '10 minutos',
    tools: [T.chrome, T.devtools, T.terminal],
    steps: [
      { text: 'Abre la página de inicio de sesión de la plataforma **sin iniciar sesión**.' },
      { text: 'Presiona **F12** (o **Ctrl + Shift + I**) para abrir las herramientas de desarrollador (la primera vez, Edge pregunta si deseas abrirlas: elige **Abrir DevTools**). Si la ventana es angosta, las pestañas ocultas están en el botón **»**.' },
      { text: 'Ve a la pestaña **Application / Aplicación** → sección **Storage / Almacenamiento** → **Cookies** → haz clic en el dominio de la plataforma.' },
      {
        text: 'Identifica las **cookies de sesión**. Suelen llamarse `PHPSESSID`, `laravel_session`, `XSRF-TOKEN`, `JSESSIONID`, `ASP.NET_SessionId`, `ci_session` o contener la palabra `session`.',
      },
      { text: `Para cada cookie de sesión, revisa la columna **${attr}**.` },
      {
        text: 'Alternativa: pestaña **Network / Red** → recarga la página (F5) → haz clic en la primera solicitud → **Response Headers / Encabezados de respuesta** → busca las líneas `Set-Cookie`.',
      },
      { text: `${OPEN_CMD} Luego pega este comando (reemplaza el dominio) y presiona Enter:`, code: 'curl.exe -sI https://dominio-de-la-plataforma | findstr /i "set-cookie"' },
    ],
    lookFor: lookFor[attr],
    decide: [
      { score: 2, text: `Todas las cookies de sesión tienen ${attr === 'SameSite' ? 'SameSite=Strict o Lax' : `el atributo ${attr}`}.` },
      { score: 1, text: `Algunas cookies de sesión lo tienen y otras no. Indica cuáles sí y cuáles no.` },
      { score: 0, text: `Ninguna cookie de sesión lo tiene.` },
      { score: 'NE', text: 'No aparece ninguna cookie de sesión sin iniciar sesión (no se puede verificar de forma pasiva).' },
    ],
    evidence: 'Captura de la tabla de cookies o de las líneas Set-Cookie, con la fecha visible. Anota el nombre de cada cookie y si tiene o no el atributo.',
  }
}

function headerHowTo(opts: { header: string; good: string; partial: string; extra?: string }): HowTo {
  return {
    time: '5 minutos (el mismo análisis sirve para todos los controles D4)',
    tools: [T.headers, T.devtools, T.terminal],
    steps: [
      { text: 'Entra a **securityheaders.com**.' },
      { text: 'Escribe la dirección completa de la plataforma, incluyendo `https://`. Marca **Hide results** para que el resultado no quede público.' },
      { text: 'Presiona **Scan** y espera unos segundos. Verás una nota (A+ a F).' },
      { text: `Busca **${opts.header}** en las secciones **Missing Headers** (faltantes, en rojo) y **Raw Headers** (presentes).` },
      { text: 'Guarda el resultado: **Ctrl + P** → en Impresora elige **Guardar como PDF** → Guardar. O toma una captura con **Win + Shift + S**.' },
      { text: `Alternativa: ${OPEN_CMD_LOWER} Luego pega:`, code: `curl.exe -sI https://dominio-de-la-plataforma | findstr /i "${opts.header.toLowerCase()}"` },
    ],
    lookFor: [opts.good, ...(opts.extra ? [opts.extra] : [])],
    decide: [
      { score: 2, text: `El header ${opts.header} está presente con un valor adecuado.` },
      { score: 1, text: opts.partial },
      { score: 0, text: `El header ${opts.header} aparece en "Missing Headers" o no está en la respuesta.` },
      { score: 'NE', text: 'El sitio no responde o el análisis no pudo completarse.' },
    ],
    evidence: 'Reporte de securityheaders.com (PDF o captura) con fecha, indicando la nota global y si el header está presente y con qué valor.',
  }
}

const SSL_STEPS: HowToStep[] = [
  { text: 'Entra a **Qualys SSL Labs** (ssllabs.com/ssltest).' },
  { text: 'Escribe solo el dominio (sin `https://`), marca **Do not show the results on the boards** y presiona **Submit**.' },
  { text: 'Espera entre 2 y 5 minutos a que termine. Si el sitio tiene varios servidores (IP), revisa cada uno.' },
  { text: 'Guarda el reporte: **Ctrl + P** → Impresora: **Guardar como PDF** → Guardar. Verifica que la fecha del análisis quede visible.' },
]

// ---------- Guías por control ----------

export const HOWTO: Record<string, HowTo> = {
  'D1-C1': {
    time: '15 minutos',
    tools: [T.chrome, T.devtools],
    steps: [
      { text: 'Abre la página de inicio de sesión de la plataforma **sin iniciar sesión**.' },
      { text: 'Lee todos los textos visibles: ayudas bajo los campos, mensajes, enlaces como "Primer ingreso" u "¿Olvidaste tu contraseña?".' },
      { text: 'Abre el código fuente: clic derecho → **Ver código fuente de la página** (o **Ctrl + U**). Se abre en una pestaña nueva.' },
      { text: 'Presiona **Ctrl + F** y busca, una a una: `contraseña`, `clave`, `password`, `rut`, `nacimiento`, `dígitos`, `placeholder`.' },
      { text: 'Revisa también documentos públicos del colegio (instructivos PDF, comunicados, página web) que expliquen cómo ingresar por primera vez.' },
    ],
    lookFor: [
      'Frases como "tu contraseña son los primeros dígitos de tu RUT", "tu clave es tu fecha de nacimiento" o similares.',
      'Comentarios ocultos en el código (`<!-- ... -->`) o textos de ayuda (placeholder) que revelen el formato de la clave.',
    ],
    decide: [
      { score: 2, text: 'No hay ninguna indicación de que la contraseña inicial se forme con datos personales.' },
      { score: 1, text: 'Solo algunos perfiles usan datos personales (p. ej., apoderados sí, docentes no). Documenta cuáles.' },
      { score: 0, text: 'Se indica (en pantalla, código o instructivo) que la contraseña inicial usa RUT, fecha de nacimiento u otro dato personal.' },
      { score: 'NE', text: NE_PASSIVE },
    ],
    evidence: 'Captura del texto en pantalla o de la línea del código fuente donde aparece, con la fecha. Si viene de un instructivo, guarda el documento o su enlace.',
  },
  'D1-C2': {
    time: '10 minutos',
    tools: [T.chrome, T.devtools],
    steps: [
      { text: 'Abre la página de inicio de sesión **sin iniciar sesión**.' },
      { text: 'Observa el campo de usuario: ¿qué dice su etiqueta o el texto gris de ejemplo? (p. ej. "Ingrese su RUT").' },
      { text: 'Abre el código fuente (**Ctrl + U**) y busca con **Ctrl + F**: `rut`, `usuario`, `username`, `login`.' },
      { text: 'Revisa instructivos o comunicados públicos que expliquen con qué usuario se ingresa.' },
    ],
    lookFor: [
      'El usuario es el RUT, el correo institucional con formato predecible (nombre.apellido) u otro dato fácil de conseguir.',
      'Textos como "Usuario: RUT sin puntos ni guion".',
    ],
    decide: [
      { score: 2, text: 'El usuario no se puede deducir de información pública y no se indica su formato.' },
      { score: 1, text: 'Solo algunos perfiles usan un identificador predecible. Documenta cuáles.' },
      { score: 0, text: 'El usuario es el RUT u otro dato público, o se puede deducir fácilmente.' },
      { score: 'NE', text: NE_PASSIVE },
    ],
    evidence: 'Captura del campo de usuario o del texto/código donde se indica el formato, con fecha.',
  },
  'D1-C3': cookieHowTo('Secure'),
  'D1-C4': cookieHowTo('HttpOnly'),
  'D1-C5': cookieHowTo('SameSite'),

  'D2-C1': {
    time: '20 minutos',
    tools: [T.wappalyzer, T.devtools, T.nvd, T.eol, T.terminal],
    steps: [
      { text: 'Instala la extensión gratuita **Wappalyzer**: en Edge desde **Complementos de Microsoft Edge**, en Chrome desde **Chrome Web Store**. Fíjala en la barra con el ícono de pieza de puzle.' },
      { text: 'Abre la plataforma y haz clic en el ícono de Wappalyzer. Busca la categoría **Web servers** (Apache, Nginx, IIS…) y anota el nombre y la **versión**.' },
      { text: 'Alternativa: **F12** → pestaña **Network / Red** → recarga (F5) → clic en la primera solicitud → **Response Headers** → mira el valor de `Server`.' },
      { text: `O bien: ${OPEN_CMD_LOWER} Luego pega:`, code: 'curl.exe -sI https://dominio-de-la-plataforma | findstr /i "server"' },
      { text: 'Busca el producto en **endoflife.date** para saber si esa versión todavía recibe actualizaciones de seguridad, y compárala con la última versión publicada en el sitio oficial.' },
      { text: 'En **NVD** busca `producto versión` (p. ej. `nginx 1.18.0`) y revisa si hay CVEs con puntaje **CVSS ≥ 9.0** (críticos).' },
    ],
    lookFor: ['Versiones antiguas sin soporte (fin de vida, "EOL").', 'CVEs con CVSS de 9.0 o más que afecten a esa versión exacta.'],
    decide: [
      { score: 2, text: 'La versión tiene soporte vigente y no tiene CVEs críticos (CVSS ≥ 9.0) conocidos.' },
      { score: 1, text: 'Solo con evidencia objetiva de una implementación incompleta (p. ej., rama con soporte pero con parches pendientes). Explica qué falta.' },
      { score: 0, text: 'La versión está en fin de vida (EOL) o tiene CVEs críticos.' },
      { score: 'NE', text: 'La versión no es visible (el servidor la oculta y Wappalyzer no la detecta).' },
    ],
    evidence: 'Captura de Wappalyzer o del header Server, enlace a la página de fin de vida y lista de CVEs encontrados en NVD con su puntaje.',
  },
  'D2-C2': {
    time: '20 minutos',
    tools: [T.wappalyzer, T.devtools, T.eol, T.nvd],
    steps: [
      { text: 'Abre la plataforma y haz clic en **Wappalyzer**. Revisa las categorías **Web frameworks** y **Programming languages** (Laravel, Django, Rails, ASP.NET, PHP…).' },
      {
        text: 'Pistas adicionales: los nombres de cookies delatan el framework (`laravel_session` → Laravel, `ci_session` → CodeIgniter, `csrftoken` → Django, `ASP.NET_SessionId` → ASP.NET).',
      },
      { text: 'En **F12 → Network → Response Headers** revisa si existe `X-Powered-By` (p. ej. `PHP/7.2.24`).' },
      { text: 'Con el nombre y la versión, busca el producto en **endoflife.date** y verifica si la versión tiene soporte de seguridad vigente.' },
      { text: 'Opcional: busca la versión en **NVD** para conocer vulnerabilidades documentadas.' },
    ],
    lookFor: ['Frameworks o lenguajes cuya versión ya no recibe parches (p. ej., PHP 7.4 o Django 2.2).'],
    decide: [
      { score: 2, text: 'El framework está en una versión con soporte y parches vigentes.' },
      { score: 1, text: 'Solo con evidencia objetiva de implementación incompleta (p. ej., rama con soporte pero muy desactualizada). Explica por qué.' },
      { score: 0, text: 'El framework está en fin de vida (EOL) o sin parches de seguridad.' },
      { score: 'NE', text: 'No es posible identificar el framework o su versión de forma pasiva.' },
    ],
    evidence: 'Captura de Wappalyzer (o de la cookie / header que lo identifica) y enlace a la política de soporte oficial.',
  },
  'D2-C3': {
    time: '30 a 60 minutos',
    tools: [T.wappalyzer, T.devtools, T.nvd],
    steps: [
      { text: 'Abre la plataforma y en **Wappalyzer** revisa **JavaScript libraries** y **UI frameworks**. Anota cada librería con su versión.' },
      { text: 'Confirma las versiones en el código fuente (**Ctrl + U**): busca `.js` y mira los nombres de archivo, p. ej. `jquery-1.12.4.min.js`.' },
      {
        text: 'Otra forma: **F12 → pestaña Console / Consola** y escribe, una por una, estas instrucciones y presiona Enter (solo leen la versión, no modifican nada). Si una responde "is not defined", esa librería no está cargada. Si el navegador bloquea el pegado, escribe `permitir pegar` (o `allow pasting`) y Enter, o escríbelas a mano:',
        code: 'jQuery.fn.jquery\n_.VERSION\nVue.version\n$.fn.tooltip.Constructor.VERSION',
      },
      { text: 'Para cada librería busca en **NVD** `librería versión` (p. ej. `lodash 4.17.15`) y anota los CVEs con **CVSS ≥ 7.0** (Alta o Crítica).' },
    ],
    lookFor: ['Librerías antiguas o en fin de vida (p. ej., jQuery anterior a 3.5 o AngularJS 1.x).', 'Varias versiones de la misma librería cargadas a la vez.'],
    decide: [
      { score: 2, text: 'Ninguna librería tiene CVEs activos de severidad Alta o Crítica.' },
      { score: 1, text: 'Solo con evidencia objetiva de implementación incompleta. Explica qué librerías están bien y cuáles no.' },
      { score: 0, text: 'Al menos una librería tiene CVEs de severidad Alta o Crítica (CVSS ≥ 7.0).' },
      { score: 'NE', text: 'No se pueden identificar las versiones de las librerías.' },
    ],
    evidence: 'Lista de librerías con versión, captura de Wappalyzer/código, y los CVEs de NVD con su puntaje CVSS. Registra cada uno como hallazgo al final.',
  },
  'D2-C4': {
    time: '5 minutos',
    tools: [T.devtools, T.headers, T.terminal],
    steps: [
      { text: 'Abre la plataforma, presiona **F12** → pestaña **Network / Red** → recarga (F5).' },
      { text: 'Haz clic en la primera solicitud (el nombre del dominio) → **Response Headers / Encabezados de respuesta**.' },
      { text: 'Busca la línea `Server`. También aparece en la sección **Raw Headers** de securityheaders.com.' },
      { text: `Alternativa: ${OPEN_CMD_LOWER} Luego pega (muestra ambos headers):`, code: 'curl.exe -sI https://dominio-de-la-plataforma | findstr /i "server x-powered-by"' },
    ],
    lookFor: ['`Server: nginx/1.18.0 (Ubuntu)` → muestra la versión exacta (malo).', '`Server: Apache`, `Server: nginx` o sin header → no expone la versión (bueno).'],
    decide: [
      { score: 2, text: 'El header Server no existe o solo muestra el nombre del producto, sin versión.' },
      { score: 1, text: 'Muestra versión parcial (p. ej., solo el número mayor) o la oculta en algunas respuestas y en otras no.' },
      { score: 0, text: 'Muestra el nombre y la versión exacta del software.' },
      { score: 'NE', text: 'El sitio no responde a las solicitudes.' },
    ],
    evidence: 'Captura del header Server en DevTools o de la ventana de comandos, con fecha. Si ves también X-Powered-By con versión, anótalo.',
  },

  'D3-C1': {
    time: '10 minutos (mismo reporte para todo D3)',
    tools: [T.ssllabs],
    steps: [...SSL_STEPS, { text: 'En el reporte, baja a la sección **Configuration → Protocols**.' }],
    lookFor: ['Las filas **TLS 1.0** y **TLS 1.1** deben decir **No**.', 'TLS 1.2 y/o TLS 1.3 deben decir **Yes**.'],
    decide: [
      { score: 2, text: 'TLS 1.0 y TLS 1.1 dicen "No" en todos los servidores.' },
      { score: 1, text: 'El sitio tiene varios servidores y solo algunos tienen TLS 1.0/1.1 activos. Indica cuáles.' },
      { score: 0, text: 'TLS 1.0 o TLS 1.1 dicen "Yes".' },
      { score: 'NE', text: 'SSL Labs no pudo completar el análisis.' },
    ],
    evidence: 'PDF del reporte de SSL Labs con fecha, mostrando la sección Protocols y la nota global.',
  },
  'D3-C2': {
    time: '5 minutos (usa el reporte de SSL Labs)',
    tools: [T.ssllabs, T.headers],
    steps: [
      ...SSL_STEPS,
      { text: 'En la sección **Protocol Details** busca la fila **Strict Transport Security (HSTS)**.' },
      { text: 'También puedes verlo en securityheaders.com como `Strict-Transport-Security`, o en la ventana de comandos:', code: 'curl.exe -sI https://dominio-de-la-plataforma | findstr /i "strict-transport"' },
    ],
    lookFor: ['Debe decir **Yes** con `max-age=` de al menos **15768000** segundos (6 meses). Un año es `31536000`.'],
    decide: [
      { score: 2, text: 'HSTS está activo con max-age de 6 meses o más.' },
      { score: 1, text: 'HSTS está activo pero con max-age menor a 6 meses.' },
      { score: 0, text: 'HSTS no está presente ("No").' },
      { score: 'NE', text: 'No se pudo obtener la respuesta del servidor.' },
    ],
    evidence: 'Captura de la fila HSTS en SSL Labs o del header en securityheaders.com, con fecha y valor de max-age.',
  },
  'D3-C3': {
    time: '5 minutos (usa el reporte de SSL Labs)',
    tools: [T.ssllabs, T.chrome],
    steps: [
      ...SSL_STEPS,
      { text: 'Revisa la sección **Certificate #1** (y #2, #3 si existen).' },
      { text: 'En cada certificado mira las filas **Trusted**, **Valid until** y **Alternative names** (debe incluir el dominio evaluado).' },
      { text: 'Verificación rápida en Edge o Chrome: haz clic en el ícono a la izquierda de la dirección (candado o ajustes) → **La conexión es segura** → ícono de certificado para ver emisor y fechas.' },
    ],
    lookFor: ['**Trusted: Yes** en verde en todos los certificados.', 'Mensajes en rojo como **NOT TRUSTED**, fecha vencida o nombre que no coincide con el dominio.'],
    decide: [
      { score: 2, text: 'Todos los certificados son confiables, vigentes y emitidos para el dominio correcto.' },
      { score: 1, text: 'El certificado principal está bien, pero algún certificado adicional (p. ej., "No SNI") no es confiable.' },
      { score: 0, text: 'El certificado principal no es confiable, está vencido o no corresponde al dominio.' },
      { score: 'NE', text: 'SSL Labs no pudo completar el análisis.' },
    ],
    evidence: 'PDF de SSL Labs con la sección Certificate, fecha de vencimiento y estado Trusted de cada certificado.',
  },
  'D3-C4': {
    time: '5 minutos (usa el reporte de SSL Labs)',
    tools: [T.ssllabs],
    steps: [...SSL_STEPS, { text: 'En la sección **Protocol Details** busca la fila **Forward Secrecy**.' }, { text: 'Opcional: en **Cipher Suites** verifica que aparezcan suites con `ECDHE` o `DHE`.' }],
    lookFor: ['**Yes (with most browsers) ROBUST** es el resultado ideal.'],
    decide: [
      { score: 2, text: 'Forward Secrecy: "Yes (with most browsers)" / ROBUST.' },
      { score: 1, text: 'Forward Secrecy: "With some browsers" (solo parcial).' },
      { score: 0, text: 'Forward Secrecy: "No".' },
      { score: 'NE', text: 'SSL Labs no pudo completar el análisis.' },
    ],
    evidence: 'Captura de la fila Forward Secrecy en el reporte de SSL Labs, con fecha.',
  },

  'D4-C1': headerHowTo({
    header: 'Content-Security-Policy',
    good: 'Debe existir `Content-Security-Policy` con reglas definidas (p. ej. `default-src \'self\'`).',
    partial: "Está presente pero es débil: permite 'unsafe-inline', 'unsafe-eval' o comodines (*) amplios.",
    extra: "Si el valor contiene `'unsafe-inline'`, `'unsafe-eval'` o `*`, la protección es parcial.",
  }),
  'D4-C2': headerHowTo({
    header: 'X-Frame-Options',
    good: 'Debe existir `X-Frame-Options: DENY` o `X-Frame-Options: SAMEORIGIN`.',
    partial: 'Tiene un valor obsoleto (ALLOW-FROM) o solo se protege mediante CSP frame-ancestors. Documéntalo.',
    extra: 'Si falta, revisa si la CSP incluye `frame-ancestors`: da una protección equivalente y conviene anotarlo en la evidencia.',
  }),
  'D4-C3': headerHowTo({
    header: 'X-Content-Type-Options',
    good: 'Debe existir `X-Content-Type-Options: nosniff`.',
    partial: 'Está presente con un valor distinto de "nosniff" o solo en algunas páginas.',
  }),
  'D4-C4': headerHowTo({
    header: 'Referrer-Policy',
    good: 'Debe existir `Referrer-Policy` con un valor como `strict-origin-when-cross-origin`, `same-origin` o `no-referrer`.',
    partial: 'Está presente pero con un valor permisivo como "unsafe-url" o "no-referrer-when-downgrade".',
  }),
  'D4-C5': headerHowTo({
    header: 'Permissions-Policy',
    good: 'Debe existir `Permissions-Policy` restringiendo funciones, p. ej. `camera=(), microphone=(), geolocation=()`.',
    partial: 'Está presente pero no restringe funciones sensibles (cámara, micrófono, geolocalización).',
  }),

  'D5-C1': {
    time: '10 minutos',
    tools: [T.chrome],
    steps: [
      { text: 'Abre la página principal y la página de inicio de sesión de la plataforma **sin iniciar sesión**.' },
      { text: 'Revisa el pie de página (abajo del todo) y los alrededores del formulario de login.' },
      { text: 'Presiona **Ctrl + F** y busca: `privacidad`, `datos personales`, `protección de datos`, `términos`.' },
      { text: 'Busca también en Google (reemplaza el dominio):', code: 'site:dominio-de-la-plataforma privacidad' },
    ],
    lookFor: ['Un enlace visible a "Política de privacidad" o similar, que se pueda abrir sin iniciar sesión.'],
    decide: [
      { score: 2, text: 'Hay una política de privacidad enlazada y visible antes o durante el acceso.' },
      { score: 1, text: 'La política existe, pero no está enlazada desde el login ni la página principal (solo se encuentra buscándola).' },
      { score: 0, text: 'No se encuentra ninguna política de privacidad.' },
      { score: 'NE', text: 'No es posible revisar el sitio sin autenticarse. Explica por qué.' },
    ],
    evidence: 'Captura del enlace y de la política (o de la búsqueda sin resultados), con la URL y la fecha.',
  },
  'D5-C2': {
    time: '15 minutos',
    tools: [T.chrome],
    steps: [
      { text: 'Abre la política de privacidad encontrada en el control anterior (D5-C1).' },
      { text: 'Presiona **Ctrl + F** y busca: `menor`, `niño`, `estudiante`, `alumno`, `salud`, `médic`, `sensible`.' },
      { text: 'Lee los párrafos donde aparecen y verifica que expliquen cómo se tratan esos datos.' },
    ],
    lookFor: ['Menciones explícitas al tratamiento de datos de **menores de edad**.', 'Menciones explícitas a **datos de salud / médicos** (datos sensibles).'],
    decide: [
      { score: 2, text: 'La política menciona explícitamente datos de menores y datos de salud.' },
      { score: 1, text: 'Solo menciona uno de los dos (menores o salud).' },
      { score: 0, text: 'No menciona ninguno, o no existe política de privacidad (D5-C1 = No cumplido).' },
      { score: 'NE', text: 'D5-C1 fue marcado N/E (no se pudo acceder a la política).' },
    ],
    evidence: 'Cita textual o captura de los párrafos relevantes de la política, con URL y fecha.',
  },
  'D5-C3': {
    time: '5 minutos',
    tools: [T.chrome],
    steps: [
      { text: 'En la barra de direcciones escribe la dirección de la plataforma agregando una ruta que no existe, por ejemplo:', code: 'https://dominio-de-la-plataforma/mesge-prueba-404' },
      { text: 'Presiona Enter y observa la página de error que aparece. Es navegación normal: no se envía nada malicioso.' },
      { text: 'Lee el mensaje completo, incluyendo el texto pequeño al final de la página.' },
    ],
    lookFor: [
      'Rutas internas del servidor (p. ej. `/var/www/html/...`).',
      'Trazas de error ("stack trace"), pantallas de depuración (p. ej. "Whoops!") o errores de base de datos.',
      'Firmas como `Apache/2.4.41 (Ubuntu) Server at ... Port 443` (nombre y versión del servidor).',
    ],
    decide: [
      { score: 2, text: 'Aparece una página de error genérica, sin datos técnicos.' },
      { score: 1, text: 'La página es genérica pero menciona el producto (p. ej. "nginx") sin versión.' },
      { score: 0, text: 'El error muestra versiones, rutas internas, trazas de código o errores de base de datos.' },
      { score: 'NE', text: NE_PASSIVE },
    ],
    evidence: 'Captura de la página de error con la URL visible y la fecha.',
  },
  'D5-C4': {
    time: '10 minutos',
    tools: [T.chrome],
    steps: [
      { text: 'Intenta abrir el archivo estándar de contacto de seguridad:', code: 'https://dominio-de-la-plataforma/.well-known/security.txt' },
      { text: 'Revisa el pie de página, la sección de contacto y la página de ayuda de la plataforma y del colegio.' },
      { text: 'Presiona **Ctrl + F** y busca: `seguridad`, `incidente`, `vulnerabilidad`, `reportar`, `CSIRT`.' },
    ],
    lookFor: ['Un correo o formulario específico para reportar incidentes o vulnerabilidades (p. ej. seguridad@colegio.cl).', 'Un archivo security.txt válido.'],
    decide: [
      { score: 2, text: 'Existe security.txt o un canal visible y específico para reportar incidentes de seguridad.' },
      { score: 1, text: 'Solo hay un contacto general que menciona incidentes, sin un procedimiento claro.' },
      { score: 0, text: 'No existe ningún mecanismo visible para reportar incidentes de seguridad.' },
      { score: 'NE', text: NE_PASSIVE },
    ],
    evidence: 'Captura del canal encontrado (o de las páginas revisadas sin resultado), con URL y fecha.',
  },
}
