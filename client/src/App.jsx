import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, CalendarDays, Bike, Plus, Menu } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';

// Navigation & Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import GlobalSearchModal from './components/GlobalSearchModal';
import NotificationDrawer from './components/NotificationDrawer';
import QuickActionModal from './components/QuickActionModal';

// Modals
import NewRentalModal from './components/modals/NewRentalModal';
import ReturnBikeModal from './components/modals/ReturnBikeModal';
import RecordPaymentModal from './components/modals/RecordPaymentModal';
import AddExpenseModal from './components/modals/AddExpenseModal';
import AddBikeModal from './components/modals/AddBikeModal';
import AddCustomerModal from './components/modals/AddCustomerModal';
import RecordSettlementModal from './components/modals/RecordSettlementModal';
import AddFuelModal from './components/modals/AddFuelModal';
import AddMaintenanceModal from './components/modals/AddMaintenanceModal';

// Pages
import Dashboard from './pages/Dashboard';
import Rentals from './pages/Rentals';
import RentalDetail from './pages/RentalDetail';
import Bikes from './pages/Bikes';
import BikeProfile from './pages/BikeProfile';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';
import FuelPage from './pages/Fuel';
import Partners from './pages/Partners';
import Settlements from './pages/Settlements';
import Ledger from './pages/Ledger';
import RentalCalendar from './pages/Calendar';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';

export default function App() {
  const { isAuthenticated, loading, user } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedBikeId, setSelectedBikeId] = useState(null);
  const [selectedRentalId, setSelectedRentalId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Refresh Key to trigger reactive dashboard re-fetch
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => {
    if (api.clearCache) api.clearCache();
    setRefreshKey((prev) => prev + 1);
  };

  // Visited tabs tracker for instant 0ms tab switching and back-navigation (Keep-Alive)
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['dashboard']));

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(currentTab)) return prev;
      const next = new Set(prev);
      next.add(currentTab);
      return next;
    });
  }, [currentTab]);

  // Modal Visibility States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Specific Action Modals
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  const [rentalPreselectedBikeId, setRentalPreselectedBikeId] = useState(null);

  const [isReturnBikeOpen, setIsReturnBikeOpen] = useState(false);
  const [returnTargetRental, setReturnTargetRental] = useState(null);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentTargetRental, setPaymentTargetRental] = useState(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expensePreselectedBikeId, setExpensePreselectedBikeId] = useState(null);

  const [isAddBikeOpen, setIsAddBikeOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [prefilledSettlementRec, setPrefilledSettlementRec] = useState(null);

  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [fuelPreselectedBikeId, setFuelPreselectedBikeId] = useState(null);

  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [maintPreselectedBikeId, setMaintPreselectedBikeId] = useState(null);

  // Partner Quick Balance
  const [partnerBalance, setPartnerBalance] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.getPartners()
        .then((res) => {
          if (res?.partners && user) {
            const myBal = res.partners.find(
              (p) => (p.email && p.email.toLowerCase() === user.email?.toLowerCase()) ||
                     (p.name && p.name.toLowerCase() === user.name?.toLowerCase())
            );
            if (myBal) setPartnerBalance(myBal);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user, refreshKey]);

  // Navigation state ref for Capacitor native back button listener
  const navStateRef = useRef({
    isMobileSidebarOpen,
    isSearchOpen,
    isNotificationsOpen,
    isQuickActionOpen,
    isNewRentalOpen,
    isReturnBikeOpen,
    isRecordPaymentOpen,
    isAddExpenseOpen,
    isAddBikeOpen,
    isAddCustomerOpen,
    isRecordSettlementOpen,
    isAddFuelOpen,
    isAddMaintenanceOpen,
    currentTab,
    selectedBikeId,
    selectedRentalId,
  });

  useEffect(() => {
    navStateRef.current = {
      isMobileSidebarOpen,
      isSearchOpen,
      isNotificationsOpen,
      isQuickActionOpen,
      isNewRentalOpen,
      isReturnBikeOpen,
      isRecordPaymentOpen,
      isAddExpenseOpen,
      isAddBikeOpen,
      isAddCustomerOpen,
      isRecordSettlementOpen,
      isAddFuelOpen,
      isAddMaintenanceOpen,
      currentTab,
      selectedBikeId,
      selectedRentalId,
    };
  }, [
    isMobileSidebarOpen,
    isSearchOpen,
    isNotificationsOpen,
    isQuickActionOpen,
    isNewRentalOpen,
    isReturnBikeOpen,
    isRecordPaymentOpen,
    isAddExpenseOpen,
    isAddBikeOpen,
    isAddCustomerOpen,
    isRecordSettlementOpen,
    isAddFuelOpen,
    isAddMaintenanceOpen,
    currentTab,
    selectedBikeId,
    selectedRentalId,
  ]);

  // Native Android Capacitor Setup (Status Bar & Hardware Back Button)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Set Status Bar to dark matching THROTTLEX theme
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#080A0F' }).catch(() => {});

    // Listen to Android hardware back button
    let backListener = null;
    const setupBackListener = async () => {
      backListener = await CapApp.addListener('backButton', () => {
        const s = navStateRef.current;

        // 1. Close mobile sidebar if open
        if (s.isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
          return;
        }
        // 2. Close modals if any are open
        if (s.isSearchOpen) {
          setIsSearchOpen(false);
          return;
        }
        if (s.isNotificationsOpen) {
          setIsNotificationsOpen(false);
          return;
        }
        if (s.isQuickActionOpen) {
          setIsQuickActionOpen(false);
          return;
        }
        if (s.isNewRentalOpen) {
          setIsNewRentalOpen(false);
          return;
        }
        if (s.isReturnBikeOpen) {
          setIsReturnBikeOpen(false);
          return;
        }
        if (s.isRecordPaymentOpen) {
          setIsRecordPaymentOpen(false);
          return;
        }
        if (s.isAddExpenseOpen) {
          setIsAddExpenseOpen(false);
          return;
        }
        if (s.isAddBikeOpen) {
          setIsAddBikeOpen(false);
          return;
        }
        if (s.isAddCustomerOpen) {
          setIsAddCustomerOpen(false);
          return;
        }
        if (s.isRecordSettlementOpen) {
          setIsRecordSettlementOpen(false);
          return;
        }
        if (s.isAddFuelOpen) {
          setIsAddFuelOpen(false);
          return;
        }
        if (s.isAddMaintenanceOpen) {
          setIsAddMaintenanceOpen(false);
          return;
        }

        // 3. Sub-views back to parent tab
        if (s.currentTab === 'bike-profile') {
          setSelectedBikeId(null);
          setCurrentTab('bikes');
          return;
        }
        if (s.currentTab === 'rental-detail') {
          setSelectedRentalId(null);
          setCurrentTab('rentals');
          return;
        }

        // 4. Other tabs back to dashboard
        if (s.currentTab !== 'dashboard') {
          setCurrentTab('dashboard');
          return;
        }

        // 5. At root dashboard with nothing open -> exit app
        CapApp.exitApp();
      });
    };

    setupBackListener();

    return () => {
      if (backListener && backListener.remove) {
        backListener.remove();
      }
    };
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Universal action dispatcher
  const handleTriggerAction = (actionId, payload = null) => {
    if (actionId === 'new_rental') {
      setRentalPreselectedBikeId(null);
      setIsNewRentalOpen(true);
    } else if (actionId === 'new_rental_for_bike') {
      setRentalPreselectedBikeId(payload);
      setIsNewRentalOpen(true);
    } else if (actionId === 'add_expense') {
      setExpensePreselectedBikeId(null);
      setIsAddExpenseOpen(true);
    } else if (actionId === 'add_expense_for_bike') {
      setExpensePreselectedBikeId(payload);
      setIsAddExpenseOpen(true);
    } else if (actionId === 'add_bike') {
      setIsAddBikeOpen(true);
    } else if (actionId === 'add_customer') {
      setIsAddCustomerOpen(true);
    } else if (actionId === 'record_payment') {
      // Open rentals page or show payment modal
      setCurrentTab('rentals');
    } else if (actionId === 'record_payment_for_rental') {
      setPaymentTargetRental(payload);
      setIsRecordPaymentOpen(true);
    } else if (actionId === 'return_bike') {
      setReturnTargetRental(payload);
      setIsReturnBikeOpen(true);
    } else if (actionId === 'record_settlement') {
      setPrefilledSettlementRec(payload);
      setIsRecordSettlementOpen(true);
    } else if (actionId === 'add_fuel' || actionId === 'add_fuel_for_bike') {
      setFuelPreselectedBikeId(payload);
      setIsAddFuelOpen(true);
    } else if (actionId === 'add_maintenance' || actionId === 'add_maintenance_for_bike') {
      setMaintPreselectedBikeId(payload);
      setIsAddMaintenanceOpen(true);
    }
  };

  const handleNavigate = (tab, id = null) => {
    if (tab === 'bike-profile' && id) {
      setSelectedBikeId(id);
      setCurrentTab('bike-profile');
    } else if (tab === 'bikes' && id) {
      setSelectedBikeId(id);
      setCurrentTab('bike-profile');
    } else if (tab === 'rental-detail' && id) {
      setSelectedRentalId(id);
      setCurrentTab('rental-detail');
    } else if (tab === 'rentals' && id) {
      setSelectedRentalId(id);
      setCurrentTab('rental-detail');
    } else {
      setCurrentTab(tab);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto relative flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
            <img src="/logo-x.png" alt="THROTTLEX" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="font-display font-bold text-white tracking-widest text-lg">
            THROTTLE<span className="text-brand-orange">X</span>
          </h2>
          <p className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">
            OWN THE ROAD.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen w-full flex bg-brand-dark text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'bikes') setSelectedBikeId(null);
          if (tab === 'rentals') setSelectedRentalId(null);
          setCurrentTab(tab);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Navbar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          partnerBalance={partnerBalance}
        />

        {/* Dynamic Page Routing with Keep-Alive for Instant 0ms Back Navigation */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {visitedTabs.has('dashboard') && (
            <div className={currentTab === 'dashboard' ? 'block animate-page-enter' : 'hidden'}>
              <Dashboard
                onNavigate={handleNavigate}
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('bikes') && (
            <div className={currentTab === 'bikes' ? 'block animate-page-enter' : 'hidden'}>
              <Bikes
                onNavigate={handleNavigate}
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {currentTab === 'bike-profile' && (
            <div className="animate-page-enter">
              <BikeProfile
                bikeId={selectedBikeId}
                onBack={() => setCurrentTab('bikes')}
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('rentals') && (
            <div className={currentTab === 'rentals' ? 'block animate-page-enter' : 'hidden'}>
              <Rentals
                onNavigate={handleNavigate}
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {currentTab === 'rental-detail' && (
            <div className="animate-page-enter">
              <RentalDetail
                rentalId={selectedRentalId}
                onBack={() => setCurrentTab('rentals')}
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('customers') && (
            <div className={currentTab === 'customers' ? 'block animate-page-enter' : 'hidden'}>
              <Customers
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('expenses') && (
            <div className={currentTab === 'expenses' ? 'block animate-page-enter' : 'hidden'}>
              <Expenses
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('maintenance') && (
            <div className={currentTab === 'maintenance' ? 'block animate-page-enter' : 'hidden'}>
              <Maintenance
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('fuel') && (
            <div className={currentTab === 'fuel' ? 'block animate-page-enter' : 'hidden'}>
              <FuelPage
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('partners') && (
            <div className={currentTab === 'partners' ? 'block animate-page-enter' : 'hidden'}>
              <Partners
                onNavigate={handleNavigate}
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('settlements') && (
            <div className={currentTab === 'settlements' ? 'block animate-page-enter' : 'hidden'}>
              <Settlements
                onTriggerAction={handleTriggerAction}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('ledger') && (
            <div className={currentTab === 'ledger' ? 'block animate-page-enter' : 'hidden'}>
              <Ledger refreshKey={refreshKey} />
            </div>
          )}

          {visitedTabs.has('calendar') && (
            <div className={currentTab === 'calendar' ? 'block animate-page-enter' : 'hidden'}>
              <RentalCalendar
                onNavigate={handleNavigate}
                refreshKey={refreshKey}
              />
            </div>
          )}

          {visitedTabs.has('reports') && (
            <div className={currentTab === 'reports' ? 'block animate-page-enter' : 'hidden'}>
              <Reports refreshKey={refreshKey} />
            </div>
          )}

          {visitedTabs.has('settings') && (
            <div className={currentTab === 'settings' ? 'block animate-page-enter' : 'hidden'}>
              <SettingsPage refreshKey={refreshKey} />
            </div>
          )}
        </main>

        {/* Mobile Sticky Bottom Navigation Bar */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-surface/95 backdrop-blur-xl border-t border-brand-border pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3 pt-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {/* Dashboard */}
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl transition-all ${
                currentTab === 'dashboard'
                  ? 'text-brand-orange font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5">Dashboard</span>
            </button>

            {/* Rentals */}
            <button
              onClick={() => {
                setSelectedRentalId(null);
                setCurrentTab('rentals');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl transition-all ${
                currentTab === 'rentals' || currentTab === 'rental-detail'
                  ? 'text-brand-orange font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className={`w-5 h-5 ${currentTab === 'rentals' || currentTab === 'rental-detail' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5">Rentals</span>
            </button>

            {/* Center Quick Action Floating Action Button */}
            <div className="flex flex-col items-center justify-center flex-1 -mt-5">
              <button
                onClick={() => setIsQuickActionOpen(true)}
                className="w-12 h-12 rounded-full bg-brand-orange hover:bg-orange-600 text-white shadow-glow flex items-center justify-center active:scale-95 transition-transform border-2 border-brand-surface"
                aria-label="Quick Actions"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
              <span className="text-[10px] text-brand-orange font-bold mt-1">Actions</span>
            </div>

            {/* Bikes */}
            <button
              onClick={() => {
                setSelectedBikeId(null);
                setCurrentTab('bikes');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl transition-all ${
                currentTab === 'bikes' || currentTab === 'bike-profile'
                  ? 'text-brand-orange font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bike className={`w-5 h-5 ${currentTab === 'bikes' || currentTab === 'bike-profile' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5">Bikes</span>
            </button>

            {/* More / Menu Drawer */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">More</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigate}
      />

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleTriggerAction}
      />

      {/* Action Modals */}
      <NewRentalModal
        isOpen={isNewRentalOpen}
        onClose={() => {
          setIsNewRentalOpen(false);
          setRentalPreselectedBikeId(null);
        }}
        onSuccess={() => {
          triggerRefresh();
        }}
        preselectedBikeId={rentalPreselectedBikeId}
      />

      <ReturnBikeModal
        isOpen={isReturnBikeOpen}
        onClose={() => {
          setIsReturnBikeOpen(false);
          setReturnTargetRental(null);
        }}
        rental={returnTargetRental}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setPaymentTargetRental(null);
        }}
        rental={paymentTargetRental}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpensePreselectedBikeId(null);
        }}
        preselectedBikeId={expensePreselectedBikeId}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      <AddBikeModal
        isOpen={isAddBikeOpen}
        onClose={() => setIsAddBikeOpen(false)}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      <RecordSettlementModal
        isOpen={isRecordSettlementOpen}
        onClose={() => {
          setIsRecordSettlementOpen(false);
          setPrefilledSettlementRec(null);
        }}
        prefilledRecommendation={prefilledSettlementRec}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      <AddFuelModal
        isOpen={isAddFuelOpen}
        onClose={() => {
          setIsAddFuelOpen(false);
          setFuelPreselectedBikeId(null);
        }}
        preselectedBikeId={fuelPreselectedBikeId}
        onSuccess={() => {
          triggerRefresh();
        }}
      />

      <AddMaintenanceModal
        isOpen={isAddMaintenanceOpen}
        onClose={() => {
          setIsAddMaintenanceOpen(false);
          setMaintPreselectedBikeId(null);
        }}
        preselectedBikeId={maintPreselectedBikeId}
        onSuccess={() => {
          triggerRefresh();
        }}
      />
    </div>
  );
}
