import React, { useState, useEffect } from 'react';
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
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

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
    <div className="min-h-screen flex bg-brand-dark text-slate-100 font-sans">
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Navbar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          partnerBalance={partnerBalance}
        />

        {/* Dynamic Page Routing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'bikes' && (
            <Bikes
              onNavigate={handleNavigate}
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'bike-profile' && (
            <BikeProfile
              bikeId={selectedBikeId}
              onBack={() => setCurrentTab('bikes')}
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'rentals' && (
            <Rentals
              onNavigate={handleNavigate}
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'rental-detail' && (
            <RentalDetail
              rentalId={selectedRentalId}
              onBack={() => setCurrentTab('rentals')}
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'customers' && (
            <Customers
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'expenses' && (
            <Expenses
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'maintenance' && (
            <Maintenance
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'fuel' && (
            <FuelPage
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'partners' && (
            <Partners
              onNavigate={handleNavigate}
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'settlements' && (
            <Settlements
              onTriggerAction={handleTriggerAction}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'ledger' && (
            <Ledger refreshKey={refreshKey} />
          )}

          {currentTab === 'calendar' && (
            <RentalCalendar
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
            />
          )}

          {currentTab === 'reports' && (
            <Reports refreshKey={refreshKey} />
          )}

          {currentTab === 'settings' && (
            <SettingsPage refreshKey={refreshKey} />
          )}
        </main>
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
