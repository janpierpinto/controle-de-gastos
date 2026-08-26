import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const PANEL_MARGIN = 8
const PANEL_MAX_HEIGHT = 360
const PANEL_MIN_HEIGHT = 160

export interface FloatingPosition {
  left: number
  width: number
  maxHeight: number
  openUp: boolean
  rectTop: number
  rectBottom: number
}

/**
 * Shared positioning/outside-click/escape logic for portaled dropdowns
 * (combobox panels, calendars, etc). Computes a `position: fixed` box whose
 * height is capped to whatever viewport space is actually available below
 * (or above, flipping when there's no room) the trigger — opening the panel
 * never grows the page's scroll height. See CategorySelect for the bug this
 * fixed the first time around.
 */
export function useFloatingPanel(open: boolean, onClose: () => void) {
  const [position, setPosition] = useState<FloatingPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_MARGIN
    const spaceAbove = rect.top - PANEL_MARGIN
    const openUp = spaceBelow < PANEL_MIN_HEIGHT && spaceAbove > spaceBelow
    const maxHeight = Math.min(PANEL_MAX_HEIGHT, Math.max(PANEL_MIN_HEIGHT, openUp ? spaceAbove : spaceBelow))
    setPosition({ left: rect.left, width: rect.width, maxHeight, openUp, rectTop: rect.top, rectBottom: rect.bottom })
  }

  useLayoutEffect(() => {
    if (open) updatePosition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onReposition = () => updatePosition()
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      onClose()
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open, onClose])

  return { triggerRef, panelRef, position }
}
