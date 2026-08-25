import { useState, type KeyboardEvent, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)
  const activeIndex = tabs.findIndex((tab) => tab.id === active)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActive(tabs[(activeIndex + 1) % tabs.length].id)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActive(tabs[(activeIndex - 1 + tabs.length) % tabs.length].id)
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções do painel"
        onKeyDown={onKeyDown}
        className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0 dark:border-slate-800"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap transition focus-visible:outline-none ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-6"
        >
          {tab.id === active && tab.content}
        </div>
      ))}
    </div>
  )
}
