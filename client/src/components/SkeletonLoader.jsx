import React from 'react';

export default function SkeletonLoader({ type = 'rentals', count = 4 }) {
  if (type === 'dashboard') {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Metric Cards Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={`dash-top-${i}`}
              className="p-4 sm:p-5 rounded-xl bg-brand-card/90 border border-brand-border/60 space-y-3 animate-shimmer"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-slate-700/60 rounded" />
                <div className="w-8 h-8 rounded-lg bg-slate-800" />
              </div>
              <div className="h-7 w-28 bg-slate-700/80 rounded" />
              <div className="h-2.5 w-16 bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={`dash-bottom-${i}`}
              className="p-4 sm:p-5 rounded-xl bg-brand-card/90 border border-brand-border/60 space-y-3 animate-shimmer"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-slate-700/60 rounded" />
                <div className="w-8 h-8 rounded-lg bg-slate-800" />
              </div>
              <div className="h-7 w-32 bg-slate-700/80 rounded" />
              <div className="h-2.5 w-20 bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="p-5 sm:p-6 rounded-2xl bg-brand-card/90 border border-brand-border/60 space-y-4 animate-shimmer">
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-slate-700/70 rounded" />
            <div className="h-6 w-24 bg-slate-800 rounded-lg" />
          </div>
          <div className="h-64 sm:h-72 w-full bg-slate-800/40 rounded-xl flex items-end gap-3 p-4">
            {[40, 65, 30, 85, 55, 95, 70, 45, 80, 60, 90, 75].map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}%` }}
                className="flex-1 bg-slate-700/40 rounded-t"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'bikes') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(count)].map((_, i) => (
          <div
            key={`bike-skel-${i}`}
            className="rounded-2xl bg-brand-card/90 border border-brand-border/60 overflow-hidden space-y-4 p-4 animate-shimmer"
          >
            {/* Image Placeholder */}
            <div className="h-44 w-full bg-slate-800/80 rounded-xl" />

            {/* Title & Badge */}
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-slate-700 rounded" />
                <div className="h-3 w-20 bg-slate-800 rounded" />
              </div>
              <div className="h-5 w-16 bg-slate-800 rounded-full" />
            </div>

            {/* Specs bar */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/50">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="h-3 w-20 bg-slate-800 rounded ml-auto" />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <div className="h-9 flex-1 bg-slate-800 rounded-xl" />
              <div className="h-9 w-20 bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: 'rentals' or 'list'
  return (
    <div className="space-y-3 animate-pulse">
      {/* Mobile Cards Skeletons */}
      <div className="sm:hidden space-y-3">
        {[...Array(count)].map((_, i) => (
          <div
            key={`skel-mobile-${i}`}
            className="p-4 rounded-xl bg-brand-surface/90 border border-brand-border space-y-3 shadow-sm animate-shimmer"
          >
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/50">
              <div className="h-4 w-24 bg-slate-700 rounded" />
              <div className="flex gap-1.5">
                <div className="h-5 w-16 bg-slate-800 rounded-full" />
                <div className="h-5 w-14 bg-slate-800 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="h-2.5 w-14 bg-slate-800 rounded" />
                <div className="h-3.5 w-24 bg-slate-700 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-14 bg-slate-800 rounded" />
                <div className="h-3.5 w-24 bg-slate-700 rounded" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-brand-border/50">
              <div className="h-4 w-20 bg-slate-700 rounded" />
              <div className="h-7 w-20 bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Row Skeletons */}
      <div className="hidden sm:block space-y-2.5">
        {[...Array(count)].map((_, i) => (
          <div
            key={`skel-desktop-${i}`}
            className="p-4 rounded-xl bg-brand-surface/60 border border-brand-border/60 flex items-center justify-between gap-4 animate-shimmer"
          >
            <div className="flex items-center gap-3 w-1/4">
              <div className="w-9 h-9 rounded-xl bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-24 bg-slate-700 rounded" />
                <div className="h-2.5 w-16 bg-slate-800 rounded" />
              </div>
            </div>

            <div className="w-1/4 space-y-1.5">
              <div className="h-3.5 w-28 bg-slate-700 rounded" />
              <div className="h-2.5 w-20 bg-slate-800 rounded" />
            </div>

            <div className="w-1/5 space-y-1.5">
              <div className="h-3.5 w-20 bg-slate-700 rounded" />
              <div className="h-2.5 w-14 bg-slate-800 rounded" />
            </div>

            <div className="flex gap-2 shrink-0">
              <div className="h-6 w-16 bg-slate-800 rounded-full" />
              <div className="h-6 w-16 bg-slate-800 rounded-full" />
            </div>

            <div className="h-8 w-20 bg-slate-800 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
