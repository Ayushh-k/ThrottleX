import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  accent = 'orange',
  onClick
}) {
  const accentGlow = {
    orange: 'hover:border-brand-orange/40 group-hover:text-brand-orange',
    emerald: 'hover:border-emerald-500/40 group-hover:text-emerald-400',
    blue: 'hover:border-sky-500/40 group-hover:text-sky-400',
    rose: 'hover:border-rose-500/40 group-hover:text-rose-400'
  }[accent] || 'hover:border-brand-orange/40';

  const iconBg = {
    orange: 'bg-brand-orange/10 text-brand-orange',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-sky-500/10 text-sky-400',
    rose: 'bg-rose-500/10 text-rose-400'
  }[accent] || 'bg-brand-orange/10 text-brand-orange';

  return (
    <div
      onClick={onClick}
      className={`group relative bg-brand-card dark:bg-brand-card border border-brand-border/60 rounded-xl p-3.5 sm:p-5 shadow-card-dark transition-all duration-200 min-w-0 overflow-hidden ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${accentGlow}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
            {title}
          </p>
          <h3 className="mt-1 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-bold font-display tracking-tight text-white dark:text-white truncate">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-lg border border-white/5 shrink-0 ${iconBg}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs gap-1 min-w-0">
          {subtitle && (
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 truncate flex-1 min-w-0">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={`font-medium px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] shrink-0 ${
                trendPositive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
