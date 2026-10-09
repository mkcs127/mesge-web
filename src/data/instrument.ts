// Generado desde MESGE_Instrumento.xlsx (hoja INSTRUMENTO MESGE). Solo contiene la definición del instrumento, sin datos de evaluaciones.
import type { Dimension, Control } from '../types'

export const DIMENSIONS: Dimension[] = [
  {
    "id": "D1",
    "name": "Autenticación y Control de Acceso",
    "weight": 0.25
  },
  {
    "id": "D2",
    "name": "Gestión de Componentes y Vulnerabilidades",
    "weight": 0.25
  },
  {
    "id": "D3",
    "name": "Seguridad en Capa de Transporte TLS/SSL",
    "weight": 0.2
  },
  {
    "id": "D4",
    "name": "Configuración de Seguridad de Aplicación Web",
    "weight": 0.2
  },
  {
    "id": "D5",
    "name": "Cumplimiento Normativo y Protección de Datos",
    "weight": 0.1
  }
]

export const CONTROLS: Control[] = [
  {
    "id": "D1-C1",
    "dimension": "D1",
    "statement": "La política de contraseñas iniciales NO utiliza datos personales del usuario como RUT, fecha de nacimiento u otro dato predecible.",
    "guide": "Revisar código fuente público del formulario de login mediante inspector del navegador. Buscar comentarios, hints o textos que revelen la política inicial.",
    "reference": "NIST SP 800-63B-4 §5.1.1 | OWASP A07:2021 | CIS IG1 #5 | ISO A.8.5"
  },
  {
    "id": "D1-C2",
    "dimension": "D1",
    "statement": "El sistema NO expone públicamente el nombre de usuario predeterminado ni permite inferirlo desde información pública (ej. RUT del alumno).",
    "guide": "Verificar en el formulario de login si se indica el formato del nombre de usuario. Revisar documentación pública o mensajes de ayuda.",
    "reference": "OWASP ASVS v4.0 §2.1 | OWASP A07:2021 | ISO A.8.5"
  },
  {
    "id": "D1-C3",
    "dimension": "D1",
    "statement": "Las cookies de sesión incluyen el flag Secure (transmisión solo sobre HTTPS).",
    "guide": "Inspeccionar headers HTTP raw de la respuesta del servidor (curl -I o DevTools > Network > Cookies). Verificar presencia del atributo Secure.",
    "reference": "OWASP ASVS v4.0 §3.4.1 | OWASP A07:2021 | ISO A.8.5"
  },
  {
    "id": "D1-C4",
    "dimension": "D1",
    "statement": "Las cookies de sesión incluyen el flag HttpOnly (no accesibles desde JavaScript).",
    "guide": "Mismo procedimiento que D1-C3. Verificar atributo HttpOnly en cada cookie de sesión.",
    "reference": "OWASP ASVS v4.0 §3.4.2 | OWASP A07:2021 | ISO A.8.5"
  },
  {
    "id": "D1-C5",
    "dimension": "D1",
    "statement": "Las cookies de sesión incluyen el atributo SameSite (Strict o Lax) para protección contra CSRF.",
    "guide": "Mismo procedimiento que D1-C3. Verificar presencia del atributo SameSite.",
    "reference": "OWASP ASVS v4.0 §3.4.3 | OWASP A07:2021 | RFC 6265bis"
  },
  {
    "id": "D2-C1",
    "dimension": "D2",
    "statement": "El servidor web principal opera con una versión con soporte activo (no EOL) y sin CVEs críticos documentados (CVSS ≥ 9.0).",
    "guide": "Identificar versión del servidor mediante Wappalyzer o header Server en respuesta HTTP. Consultar NIST NVD (nvd.nist.gov) con la versión exacta.",
    "reference": "OWASP A06:2021 | CIS IG1 #2, #7 | ISO A.8.8"
  },
  {
    "id": "D2-C2",
    "dimension": "D2",
    "statement": "El framework de aplicación web principal opera con una versión con soporte activo y parches de seguridad vigentes.",
    "guide": "Identificar framework y versión mediante Wappalyzer o análisis de código fuente. Verificar política de soporte oficial del framework.",
    "reference": "OWASP A06:2021 | CIS IG1 #2 | ISO A.8.8"
  },
  {
    "id": "D2-C3",
    "dimension": "D2",
    "statement": "Las bibliotecas JavaScript del lado cliente (jQuery, Lodash, Vue, etc.) están en versiones sin CVEs activos de severidad Alta o Crítica.",
    "guide": "Identificar versiones con Wappalyzer y código fuente. Consultar NVD por cada componente y versión detectada.",
    "reference": "OWASP A06:2021 | CIS IG1 #2, #7 | ISO A.8.8"
  },
  {
    "id": "D2-C4",
    "dimension": "D2",
    "statement": "El servidor NO expone la versión exacta del software en el header Server de las respuestas HTTP.",
    "guide": "Ejecutar: curl -I https://[dominio] y verificar el campo 'Server:'. Si muestra nombre+versión exacta, control no cumplido.",
    "reference": "OWASP A05:2021 | CIS IG1 #4 | ISO A.8.9"
  },
  {
    "id": "D3-C1",
    "dimension": "D3",
    "statement": "El servidor NO soporta TLS 1.0 ni TLS 1.1 (protocolos deprecados desde RFC 8996, 2021).",
    "guide": "Ejecutar análisis en Qualys SSL Labs (ssllabs.com/ssltest). Verificar sección 'Protocol Support'. TLS 1.0 o 1.1 marcados como soportados = No Cumplido.",
    "reference": "RFC 8996 | NIST SP 800-52r2 §3.3 | OWASP A02:2021 | ISO A.8.20"
  },
  {
    "id": "D3-C2",
    "dimension": "D3",
    "statement": "El servidor implementa HSTS (HTTP Strict Transport Security) con una directiva max-age mínima de 6 meses.",
    "guide": "Verificar en Qualys SSL Labs sección 'HTTP Strict Transport Security' O en headers raw: curl -I https://[dominio] | grep Strict.",
    "reference": "OWASP ASVS v4.0 §9.1.3 | NIST SP 800-52r2 §3.4 | OWASP A02:2021"
  },
  {
    "id": "D3-C3",
    "dimension": "D3",
    "statement": "El certificado SSL principal es válido, confiable y emitido para el dominio correcto (sin alertas en navegadores modernos).",
    "guide": "Verificar en Qualys SSL Labs sección 'Certificate'. El certificado principal debe ser TRUSTED en todos los navegadores listados.",
    "reference": "ISO A.8.20 | OWASP A02:2021"
  },
  {
    "id": "D3-C4",
    "dimension": "D3",
    "statement": "El servidor implementa Forward Secrecy en los cipher suites activos.",
    "guide": "Verificar en Qualys SSL Labs sección 'Cipher Suites'. Confirmar presencia de suites ECDHE o DHE que garantizan Forward Secrecy.",
    "reference": "NIST SP 800-52r2 | ISO A.8.20"
  },
  {
    "id": "D4-C1",
    "dimension": "D4",
    "statement": "El servidor implementa el header Content-Security-Policy (CSP) para mitigar ataques XSS.",
    "guide": "Ejecutar análisis en securityheaders.com. Verificar presencia de 'Content-Security-Policy' en la tabla de resultados.",
    "reference": "OWASP Secure Headers Project | OWASP A05:2021 | ISO A.8.9, A.8.26"
  },
  {
    "id": "D4-C2",
    "dimension": "D4",
    "statement": "El servidor implementa el header X-Frame-Options (DENY o SAMEORIGIN) para prevenir clickjacking.",
    "guide": "Mismo análisis securityheaders.com. Verificar presencia de 'X-Frame-Options'.",
    "reference": "OWASP Secure Headers Project | OWASP A05:2021 | ISO A.8.9"
  },
  {
    "id": "D4-C3",
    "dimension": "D4",
    "statement": "El servidor implementa el header X-Content-Type-Options: nosniff.",
    "guide": "Mismo análisis securityheaders.com. Verificar 'X-Content-Type-Options'.",
    "reference": "OWASP Secure Headers Project | OWASP A05:2021 | ISO A.8.9"
  },
  {
    "id": "D4-C4",
    "dimension": "D4",
    "statement": "El servidor implementa el header Referrer-Policy para controlar la divulgación de URLs internas.",
    "guide": "Mismo análisis securityheaders.com. Verificar 'Referrer-Policy'.",
    "reference": "OWASP Secure Headers Project | OWASP A05:2021"
  },
  {
    "id": "D4-C5",
    "dimension": "D4",
    "statement": "El servidor implementa el header Permissions-Policy para restringir el acceso a APIs del navegador.",
    "guide": "Mismo análisis securityheaders.com. Verificar 'Permissions-Policy'.",
    "reference": "OWASP Secure Headers Project | ISO A.8.26"
  },
  {
    "id": "D5-C1",
    "dimension": "D5",
    "statement": "La plataforma publica una política de privacidad visible y accesible para los usuarios antes o durante el acceso.",
    "guide": "Navegar la URL pública sin autenticación. Buscar enlace a política de privacidad en login, footer o página principal.",
    "reference": "Ley 19.628 Art. 4 | Ley 21.719 Art. 14 | ISO A.8.15"
  },
  {
    "id": "D5-C2",
    "dimension": "D5",
    "statement": "La política de privacidad declara explícitamente el tratamiento de datos de menores de edad y los datos médicos o de salud.",
    "guide": "Si la política existe (D5-C1), revisar si menciona menores, datos sensibles o categorías especiales. Si D5-C1 es N/E, este control también es N/E.",
    "reference": "Ley 19.628 Art. 10 (datos sensibles) | Ley 21.719 Art. 16 | ISO A.8.15"
  },
  {
    "id": "D5-C3",
    "dimension": "D5",
    "statement": "El sitio público NO muestra mensajes de error que expongan información técnica interna (stack traces, rutas de servidor, versiones).",
    "guide": "Intentar acceder a una URL inexistente (404) y verificar el mensaje de error. Revisar si expone información técnica del framework o servidor.",
    "reference": "OWASP A05:2021 | ISO A.8.9"
  },
  {
    "id": "D5-C4",
    "dimension": "D5",
    "statement": "Existe un mecanismo visible para reportar incidentes de seguridad o vulnerabilidades (contacto de seguridad, política de divulgación).",
    "guide": "Buscar en el sitio público referencias a contacto de seguridad, política de divulgación responsable o correo de seguridad.",
    "reference": "Ley 21.663 Art. 9 (notificación de incidentes) | ISO A.8.15 | NIST CSF GV.PO"
  }
]
