# MESGE Web — Prototipo

Versión web del instrumento **MESGE** (Matriz de Evaluación de Seguridad para Gestión Escolar), portada desde `MESGE_Instrumento.xlsx`.
Guía al evaluador paso a paso (estilo Typeform), calcula el **Índice de Madurez de Seguridad (IMS)** y genera un informe PDF.

## Privacidad (procesamiento 100 % local)

- Todo el cálculo y la generación del PDF ocurren en el navegador. No hay backend ni llamadas a APIs.
- Las respuestas se autoguardan en `localStorage` del propio navegador para poder retomar la evaluación; se pueden exportar a `.json` o borrar desde la pantalla de resultados.
- El build de producción incluye una **Content-Security-Policy** (`connect-src 'self'`, sin orígenes externos) que impide a nivel de navegador enviar datos a terceros.
- No se usan fuentes ni CDNs externos.

## Uso

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # genera la versión estática en dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

La carpeta `dist/` es un sitio estático: puede publicarse en cualquier hosting estático (GitHub Pages, Netlify, servidor del establecimiento) sin backend.

## Publicación en GitHub Pages

El repositorio incluye `.github/workflows/deploy.yml`: en cada push a `main`, GitHub compila la app y publica `dist/`.
En el repositorio: **Settings → Pages → Source: GitHub Actions**. La URL queda como `https://<usuario>.github.io/<repositorio>/`.
No se suben `node_modules/` ni `dist/` (excluidos en `.gitignore`).

## Flujo

1. Bienvenida → **preparación**: checklist obligatorio antes de iniciar (URL de la plataforma validada, Edge/Chrome, F12, Wappalyzer, acceso a SSL Labs / securityheaders.com / NVD, carpeta de evidencias y compromiso de análisis pasivo autorizado; cmd/curl.exe y tiempo disponible son opcionales). Contenido en `src/data/checklist.ts`.
   → datos de la evaluación (establecimiento, plataforma precargada desde el checklist, fecha, evaluador).
2. Por cada dimensión (D1–D5): pantalla de introducción con herramientas sugeridas y luego un control por pantalla.
   - Opciones: Cumplido (2) · Parcial (1) · No cumplido (0) · N/E (excluido). Teclas `A`–`D` y `Enter`.
   - Parcial exige evidencia (criterio RNF-02). D5-C2 sugiere N/E si D5-C1 es N/E.
   - Botón **¿Cómo lo hago?** (tecla `H`): panel con paso a paso para usuarios sin experiencia (herramientas, pasos, comandos copiables, qué buscar, cómo decidir y qué evidencia guardar). Contenido en `src/data/howto.ts`.
3. Inventario de hallazgos con CVSS v3.1 (opcional) → brechas priorizadas (RF-03).
4. Resultados: IMS global, nivel de madurez, puntaje por dimensión, brechas y detalle; descarga de PDF y exportación JSON.

La versión publicable no incluye datos de ninguna evaluación: la app parte en blanco y solo procesa lo que ingresa cada usuario en su navegador.

## Cálculo (igual que la hoja CÁLCULO IMS)

- `PDi = Σ puntos obtenidos / Σ puntos posibles × 100` (N/E fuera del denominador).
- `IMS = PD1×0,25 + PD2×0,25 + PD3×0,20 + PD4×0,20 + PD5×0,10`.
- Niveles: ≤25 Crítico · ≤50 Deficiente · ≤75 Básico · >75 Adecuado.
- Diferencia con el Excel: si una dimensión completa queda en N/E (el Excel daría `#DIV/0!`), se excluye y su peso se redistribuye proporcionalmente; el informe lo indica.

## Estructura

```
src/
  data/instrument.ts   Controles y dimensiones (generado desde el Excel, sin datos de evaluaciones)
  lib/scoring.ts       Algoritmo IMS, niveles y severidad CVSS
  lib/pdf.ts           Informe PDF (jsPDF + autotable)
  lib/storage.ts       Autoguardado local, exportar/importar JSON
  steps.ts             Secuencia de pasos del formulario
  components/          Pantallas (bienvenida, datos, dimensión, control, hallazgos, resultados)
```

Para actualizar el instrumento (RNF-05: nuevos controles o pesos), editar `src/data/instrument.ts`.
