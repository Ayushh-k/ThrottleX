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
      className={`group relative bg-brand-card dark:bg-brand-card border border-brand-border/60 rounded-xl p-5 shadow-card-dark transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${accentGlow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl lg:text-3xl font-bold font-display tracking-tight text-white dark:text-white">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg border border-white/5 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-slate-400 dark:text-slate-400 truncate max-w-[70%]">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={`font-medium px-1.5 py-0.5 rounded text-[11px] ${
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
