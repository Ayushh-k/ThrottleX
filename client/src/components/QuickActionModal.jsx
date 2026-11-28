import React from 'react';
import { X, CalendarPlus, Receipt, Bike, UserPlus, CreditCard, Scale } from 'lucide-react';

export default function QuickActionModal({ isOpen, onClose, onSelectAction }) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'new_rental',
      title: 'New Rental',
      desc: 'Book a bike for customer, calculate rent, collect advance',
      icon: CalendarPlus,
      color: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:border-brand-orange'
    },
    {
      id: 'add_expense',
      title: 'Add Expense',
      desc: 'Log petrol, repair, service, or other business expenses',
      icon: Receipt,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:border-rose-400'
    },
    {
      id: 'record_payment',
      title: 'Record Payment',
      desc: 'Collect customer balance payment via UPI, Cash, or Bank',
      icon: CreditCard,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-400'
    },
    {
      id: 'record_settlement',
      title: 'Record Settlement',
      desc: 'Settle partner balances & transfer owed profit/expenses',
      icon: Scale,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:border-sky-400'
    },
    {
      id: 'add_bike',
      title: 'Add Bike',
      desc: 'Register a new motorcycle into the THROTTLEX fleet',
      icon: Bike,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-400'
    },
    {
      id: 'add_customer',
      title: 'Add Customer',
      desc: 'Create customer profile with driving licence & Aadhaar',
      icon: UserPlus,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-modal-backdrop overflow-hidden">
      <div className="relative w-full max-w-xl bg-brand-card dark:bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 max-h-[92vh] flex flex-col animate-mac-modal">
        {/* Mobile Handle */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 shrink-0" />

        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-brand-border shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-white">Quick Actions</h3>
            <p className="text-xs text-slate-400">Perform immediate rental operations in seconds</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-4 overflow-y-auto pb-4 overscroll-contain">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onClose();
                  onSelectAction(act.id);
                }}
                className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all active:scale-[0.98] sm:hover:-translate-y-0.5 bg-brand-surface/70 ${act.color} min-h-[56px]`}
              >
                <div className="p-2.5 rounded-lg bg-white/5 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">{act.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
