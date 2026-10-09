import { useState } from 'react'
import { CHECKLIST, normalizePlatformUrl, type ChecklistItem } from '../data/checklist'
import { useEnter } from '../hooks'
import type { Evaluation } from '../types'
import { CodeBlock } from './HowToPanel'
import { Check } from './MetaStep'

interface Props {
  ev: Evaluation
  onToggle: (id: string, value: boolean) => void
  onPlatform: (value: string) => void
  onNext: () => void
}

export function Checklist({ ev, onToggle, onPlatform, onNext }: Props) {
  const [tried, setTried] = useState(false)
  const checked = ev.checklist ?? {}
  const required = CHECKLIST.filter((i) => i.required)
  const done = required.filter((i) => checked[i.id]).length
  const ready = done === required.length

  const submit = () => {
    setTried(true)
    if (ready) onNext()
  }
  useEnter(submit)

  const groups = [...new Set(CHECKLIST.map((i) => i.group))]

  return (
    <section className="question wide">
      <p className="q-kicker">Preparación</p>
      <h2 className="q-title">Antes de comenzar, verifica que tienes todo listo</h2>
      <p className="q-help">
        Marca cada punto a medida que lo confirmas. Todo es gratuito y no requiere acceso privilegiado a la plataforma. Los puntos opcionales no
        impiden continuar.
      </p>

      <div className="check-progress">
        <div className="progress">
          <div className="progress-fill" style={{ width: `${(done / required.length) * 100}%` }} />
        </div>
        <span>
          <strong>{done}</strong> de {required.length} requisitos listos
        </span>
      </div>

      {groups.map((g) => (
        <div key={g} className="check-group">
          <h3>{g}</h3>
          {CHECKLIST.filter((i) => i.group === g).map((item) =>
            item.kind === 'url' ? (
              <UrlItem
                key={item.id}
                item={item}
                ok={!!checked[item.id]}
                initial={ev.meta.platform}
                highlight={tried && !checked[item.id]}
                onValid={(url) => {
                  onPlatform(url ?? '')
                  onToggle(item.id, url !== null)
                }}
              />
            ) : (
              <CheckItem key={item.id} item={item} ok={!!checked[item.id]} highlight={tried && item.required && !checked[item.id]} onToggle={onToggle} />
            ),
          )}
        </div>
      ))}

      {tried && !ready && <p className="error">Faltan {required.length - done} requisito(s) marcados en rojo para poder comenzar.</p>}
      <div className="q-actions">
        <button className={`btn primary ${ready ? '' : 'soft-disabled'}`} onClick={submit}>
          Todo listo, comenzar <Check />
        </button>
        <span className="hint">{ready ? <>o presiona <kbd>Enter ↵</kbd></> : 'Completa los requisitos para continuar'}</span>
      </div>
    </section>
  )
}

function CheckItem({ item, ok, highlight, onToggle }: { item: ChecklistItem; ok: boolean; highlight: boolean; onToggle: (id: string, v: boolean) => void }) {
  return (
    <div className={`check-item ${ok ? 'done' : ''} ${highlight ? 'missing' : ''}`}>
      <button className="check-box" role="checkbox" aria-checked={ok} aria-label={item.title} onClick={() => onToggle(item.id, !ok)}>
        {ok && <Check />}
      </button>
      <div className="check-body">
        <button className="check-title" onClick={() => onToggle(item.id, !ok)}>
          {item.title}
          {!item.required && <span className="opt-badge">Opcional</span>}
        </button>
        <p>{item.description}</p>
        {item.code && <CodeBlock code={item.code} />}
        {item.links && (
          <div className="chips">
            {item.links.map((l) => (
              <a key={l.label} className="chip link-chip" href={l.url} target="_blank" rel="noreferrer noopener">
                {l.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UrlItem({ item, ok, initial, highlight, onValid }: { item: ChecklistItem; ok: boolean; initial: string; highlight: boolean; onValid: (url: string | null) => void }) {
  const [value, setValue] = useState(initial)
  const invalid = value.trim() !== '' && normalizePlatformUrl(value) === null

  return (
    <div className={`check-item ${ok ? 'done' : ''} ${highlight ? 'missing' : ''}`}>
      <span className="check-box static" aria-hidden>
        {ok && <Check />}
      </span>
      <div className="check-body">
        <span className="check-title">{item.title}</span>
        <p>{item.description}</p>
        <input
          className="url-input"
          type="url"
          inputMode="url"
          placeholder="https://plataforma.colegio.cl"
          value={value}
          autoFocus={!ok}
          onChange={(e) => {
            setValue(e.target.value)
            onValid(normalizePlatformUrl(e.target.value))
          }}
          aria-label="URL de la plataforma"
        />
        {invalid && <small className="error">Ingresa una dirección válida, por ejemplo https://plataforma.colegio.cl</small>}
        {ok && <small className="ok-text">Dirección válida: {normalizePlatformUrl(value)}</small>}
      </div>
    </div>
  )
}
