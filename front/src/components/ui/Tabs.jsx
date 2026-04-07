export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 border-b border-zinc-200 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-t-lg',
            activeTab === tab.value
              ? 'text-primary-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-700'
              : 'text-zinc-500 hover:text-zinc-700',
          ].join(' ')}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={[
                'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-zinc-100 text-zinc-500',
              ].join(' ')}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
