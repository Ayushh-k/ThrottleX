import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Bike, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

export default function RentalCalendar({ onNavigate, refreshKey }) {
  const [rentals, setRentals] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, bRes] = await Promise.all([api.getRentals(), api.getBikes()]);
      setRentals(rRes.rentals || []);
      setBikes(bRes.bikes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Rental Calendar</h1>
          <p className="text-xs text-slate-400">
            Interactive visual schedule of bike allocations, active trips, and returns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-brand-card border border-brand-border text-slate-300 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm text-white px-3 min-w-[140px] text-center font-display">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-brand-card border border-brand-border text-slate-300 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border shadow-card-dark overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] p-2 rounded-xl bg-brand-surface/30 opacity-30" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const cellDate = new Date(year, month, dayNum);
            const isToday =
              new Date().toDateString() === cellDate.toDateString();

            // Find rentals covering this date
            const dayRentals = rentals.filter((r) => {
              if (r.status === 'cancelled') return false;
              const start = new Date(r.startDate);
              const end = new Date(r.expectedEndDate);
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
              return cellDate >= start && cellDate <= end;
            });

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                  isToday
                    ? 'border-brand-orange bg-brand-orange/5 shadow-glow-sm'
                    : 'border-brand-border/60 bg-brand-surface/50 hover:border-brand-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayRentals.length > 0 && (
                    <span className="text-[10px] font-semibold text-brand-orange">
                      {dayRentals.length} booked
                    </span>
                  )}
                </div>

                {/* Badges for rentals */}
                <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-20">
                  {dayRentals.map((r) => (
                    <div
                      key={r._id}
                      onClick={() => onNavigate('rental-detail', r._id)}
                      className={`p-1 rounded bg-brand-card text-[10px] cursor-pointer transition-colors ${
                        r.rentalType === 'hourly'
                          ? 'border border-purple-500/50 hover:border-purple-400'
                          : 'border border-brand-border/80 hover:border-brand-orange'
                      }`}
                    >
                      <p className="font-semibold text-white truncate leading-tight flex items-center gap-1">
                        {r.rentalType === 'hourly' && <span className="text-purple-400 text-[9px]">⏱️</span>}
                        {r.bike?.name?.split(' ')[2] || r.bike?.name}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {r.customer?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
