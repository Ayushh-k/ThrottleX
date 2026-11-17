import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Bike, Users, Calendar, Receipt, UserCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ bikes: [], customers: [], rentals: [], expenses: [], partners: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ bikes: [], customers: [], rentals: [], expenses: [], partners: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ bikes: [], customers: [], rentals: [], expenses: [], partners: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.globalSearch(query);
        setResults(res);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasResults =
    results.bikes.length > 0 ||
    results.customers.length > 0 ||
    results.rentals.length > 0 ||
    results.expenses.length > 0 ||
    results.partners.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-brand-card dark:bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-brand-border bg-brand-surface">
          <Search className="w-5 h-5 text-brand-orange mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search bikes, customers, rentals, expenses, partners... (e.g. Rahul, Hunter, Petrol)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-mono bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <div className="inline-block w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mr-2" />
              Searching THROTTLEX records...
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="py-8 text-center text-slate-400 text-sm">
              No matching records found for "{query}".
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Type at least 2 characters to search across bikes, customers, rentals, and expenses.
            </div>
          )}

          {/* Bikes */}
          {results.bikes.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-brand-orange" /> Bikes
              </p>
              <div className="space-y-1.5">
                {results.bikes.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => {
                      onNavigate('bikes', b._id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-brand-surface/60 hover:bg-brand-orange/10 border border-brand-border/40 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-brand-orange">
                        {b.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {b.registrationNumber} • {formatINR(b.defaultDailyRate)}/day • {formatINR(b.defaultHourlyRate || Math.round(b.defaultDailyRate / 8))}/hr
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" /> Customers
              </p>
              <div className="space-y-1.5">
                {results.customers.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => {
                      onNavigate('customers', c._id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-brand-surface/60 hover:bg-sky-500/10 border border-brand-border/40 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-sky-400">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.phone} • {c.totalRentals || 0} rentals • {formatINR(c.totalSpent)} total spent
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rentals */}
          {results.rentals.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Rentals
              </p>
              <div className="space-y-1.5">
                {results.rentals.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => {
                      onNavigate('rentals', r._id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-brand-surface/60 hover:bg-emerald-500/10 border border-brand-border/40 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-emerald-400">
                        #{r.rentalNumber} • {r.bike?.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Customer: {r.customer?.name} • Total: {formatINR(r.totalAmount)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-300 uppercase px-2 py-0.5 rounded bg-white/5">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {results.expenses.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-400" /> Expenses
              </p>
              <div className="space-y-1.5">
                {results.expenses.map((e) => (
                  <div
                    key={e._id}
                    onClick={() => {
                      onNavigate('expenses');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-brand-surface/60 hover:bg-amber-500/10 border border-brand-border/40 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-amber-400">
                        {e.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        Category: {e.category} • Paid by: {e.paidByPartner?.name}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-rose-400">
                      -{formatINR(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partners */}
          {results.partners.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" /> Partners
              </p>
              <div className="space-y-1.5">
                {results.partners.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      onNavigate('partners', p._id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-brand-surface/60 hover:bg-purple-500/10 border border-brand-border/40 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-purple-400">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.email} • {p.sharePercentage}% Share
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
