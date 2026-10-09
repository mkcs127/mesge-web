import { useEffect, useLayoutEffect, useRef } from 'react'

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

/**
 * Enter avanza al siguiente paso (como en Typeform). Dentro de un textarea se usa
 * Ctrl/Cmd + Enter para no interferir con los saltos de línea.
 */
export function useEnter(handler: () => void, enabled = true) {
  const ref = useRef(handler)
  useLayoutEffect(() => {
    ref.current = handler
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return
      const mod = e.metaKey || e.ctrlKey
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'BUTTON' && !mod) return
      const emptyTextarea = tag === 'TEXTAREA' && (e.target as HTMLTextAreaElement).value.trim() === ''
      if (isTyping(e.target) && !mod && !emptyTextarea) return
      e.preventDefault()
      ref.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

/** Atajos de una tecla (A/B/C/D o 1/2/3/4) mientras no se esté escribiendo. */
export function useKeyShortcuts(map: Record<string, () => void>, enabled = true) {
  const ref = useRef(map)
  useLayoutEffect(() => {
    ref.current = map
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || isTyping(e.target)) return
      const fn = ref.current[e.key.toLowerCase()]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
