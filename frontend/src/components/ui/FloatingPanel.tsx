import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { FloatingPosition } from '../../lib/useFloatingPanel'

export function FloatingPanel({
  panelRef,
  position,
  children,
  widthOverride,
}: {
  panelRef: RefObject<HTMLDivElement | null>
  position: FloatingPosition
  children: ReactNode
  widthOverride?: number
}) {
  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: position.left,
        width: widthOverride ?? position.width,
        maxHeight: position.maxHeight,
        top: position.openUp ? undefined : position.rectBottom + 8,
        bottom: position.openUp ? window.innerHeight - position.rectTop + 8 : undefined,
      }}
      className="z-50 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      {children}
    </div>,
    document.body,
  )
}
