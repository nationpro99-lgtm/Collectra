/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { storageService, AppState } from './services/storage';
import { Invoice, Customer, FollowUp, PromiseToPay } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { CollectIQLogo } from './components/common/Graphics';
import { Loader2 } from 'lucide-react';

// Modals
import { CreateInvoiceModal } from './components/modals/CreateInvoiceModal';
import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { AddCustomerModal } from './components/modals/AddCustomerModal';
import { CustomerDetailModal } from './components/modals/CustomerDetailModal';
import { SendReminderModal } from './components/modals/SendReminderModal';
import { AIAssistantDrawer } from './components/modals/AIAssistantDrawer';
import { UpgradeModal } from './components/modals/UpgradeModal';
import { RecordPromiseModal } from './components/modals/RecordPromiseModal';

// Pages
import { DashboardPage } from './components/pages/DashboardPage';
import { InvoicesPage } from './components/pages/InvoicesPage';
import { CustomersPage } from './components/pages/CustomersPage';
import { FollowUpsPage } from './components/pages/FollowUpsPage';
import { PromisesToPayPage } from './components/pages/PromisesToPayPage';
import { PaymentsPage } from './components/pages/PaymentsPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { TeamPage } from './components/pages/TeamPage';
import { IntegrationsPage } from './components/pages/IntegrationsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { CustomerPaymentPage } from './components/pages/CustomerPaymentPage';

function CollectIQMain() {
  const { isAuthenticated, isLoading, currentBusiness } = useAuth();
  const [authRoute, setAuthRoute] = useState<'login' | 'register' | 'forgot-password'>('login');

  const [state, setState] = useState<AppState>(storageService.getState());
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal active states
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [reminderData, setReminderData] = useState<{
    customerName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    overdueDays?: number;
    customerPhone?: string;
  } | null>(null);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isRecordPromiseOpen, setIsRecordPromiseOpen] = useState(false);

  // Sync state whenever current business changes
  useEffect(() => {
    setState(storageService.getState());
  }, [currentBusiness?.businessId]);

  // Reactive subscription to storage changes
  useEffect(() => {
    const unsub = storageService.subscribe((newState) => {
      setState(newState);
      if (selectedInvoice) {
        const found = newState.invoices.find((i) => i.id === selectedInvoice.id);
        if (found) setSelectedInvoice(found);
      }
      if (selectedCustomer) {
        const found = newState.customers.find((c) => c.id === selectedCustomer.id);
        if (found) setSelectedCustomer(found);
      }
    });
    return unsub;
  }, [selectedInvoice, selectedCustomer]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f2f2fd] via-[#f7f8fe] to-[#ebeffd] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <CollectIQLogo size={48} />
          <div className="flex items-center gap-2.5 text-indigo-700 text-sm font-semibold">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading your CollectIQ workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Auth flow
  if (!isAuthenticated) {
    if (authRoute === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthRoute('login')} />;
    }
    if (authRoute === 'forgot-password') {
      return <ForgotPasswordPage onNavigateToLogin={() => setAuthRoute('login')} />;
    }
    return (
      <LoginPage
        onNavigateToRegister={() => setAuthRoute('register')}
        onNavigateToForgotPassword={() => setAuthRoute('forgot-password')}
      />
    );
  }

  // Handlers for cross-modal actions
  const handleOpenRemindModal = (params: {
    customerName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    overdueDays?: number;
    customerPhone?: string;
  }) => {
    setReminderData(params);
  };

  const handleRemindFollowUp = (fol: FollowUp) => {
    const cust = state.customers.find(
      (c) => c.id === fol.customerId || c.name.toLowerCase() === fol.customerName.toLowerCase()
    );
    handleOpenRemindModal({
      customerName: fol.customerName,
      invoiceNumber: fol.invoiceNumber,
      amount: fol.amountDue,
      dueDate: fol.dueDate,
      overdueDays: fol.status === 'overdue' ? 20 : 0,
      customerPhone: cust?.phone,
    });
  };

  const handleRemindInvoice = (inv: Invoice) => {
    const cust = state.customers.find(
      (c) => c.id === inv.customerId || c.name.toLowerCase() === inv.customerName.toLowerCase()
    );
    handleOpenRemindModal({
      customerName: inv.customerName,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.balance || inv.amount,
      dueDate: inv.dueDate,
      overdueDays: inv.overdueDays,
      customerPhone: cust?.phone,
    });
  };

  const handleRemindCustomer = (cust: Customer) => {
    const latestInv = state.invoices.find((i) => i.customerId === cust.id && i.status !== 'paid');
    handleOpenRemindModal({
      customerName: cust.name,
      invoiceNumber: latestInv?.invoiceNumber || 'INV-CURRENT',
      amount: cust.outstandingBalance,
      dueDate: latestInv?.dueDate || 'Immediate',
      overdueDays: cust.overdueDays,
      customerPhone: cust.phone,
    });
  };

  const handlePayFromPromise = (ptp: PromiseToPay) => {
    const inv = state.invoices.find((i) => i.id === ptp.invoiceId || i.invoiceNumber === ptp.invoiceNumber);
    if (inv) {
      setInvoiceToPay(inv);
    } else {
      setInvoiceToPay({
        id: ptp.invoiceId,
        invoiceNumber: ptp.invoiceNumber,
        customerId: ptp.customerId,
        customerName: ptp.customerName,
        customerEmail: 'accounts@client.com',
        customerCompany: ptp.customerName,
        issueDate: '2025-06-01',
        dueDate: ptp.promisedDate,
        amount: ptp.promisedAmount,
        paidAmount: 0,
        balance: ptp.promisedAmount,
        status: 'pending',
        items: [],
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2fd] via-[#f7f8fe] to-[#f4f5fd] text-slate-800 font-sans flex antialiased">
      {/* Left Persistent Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(p) => setCurrentPage(p)}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        overdueCount={state.invoices.filter((i) => i.status === 'overdue').length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onNavigate={(p) => setCurrentPage(p)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          state={state}
          onSelectInvoice={(id) => {
            const inv = state.invoices.find((i) => i.id === id);
            if (inv) setSelectedInvoice(inv);
          }}
          onSelectCustomer={(id) => {
            const cust = state.customers.find((c) => c.id === id);
            if (cust) setSelectedCustomer(cust);
          }}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-7 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              state={state}
              onNavigate={(p) => setCurrentPage(p)}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
              onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
              onRemindFollowUp={handleRemindFollowUp}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              onSelectPromise={(p) => handlePayFromPromise(p)}
              onToggleTask={(id) => storageService.toggleTask(id)}
              onAddInvoice={() => setIsCreateInvoiceOpen(true)}
              onAddCustomer={() => {
                setCustomerToEdit(null);
                setIsAddCustomerOpen(true);
              }}
              onSendReminderQuick={() => {
                const target = state.followUps[0];
                if (target) handleRemindFollowUp(target);
              }}
            />
          )}

          {currentPage === 'invoices' && (
            <InvoicesPage
              state={state}
              onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
              onViewInvoice={(inv) => setSelectedInvoice(inv)}
              onRecordPayment={(inv) => setInvoiceToPay(inv)}
              onSendReminder={handleRemindInvoice}
            />
          )}

          {currentPage === 'customers' && (
            <CustomersPage
              state={state}
              onOpenAddCustomer={() => {
                setCustomerToEdit(null);
                setIsAddCustomerOpen(true);
              }}
              onViewCustomer={(cust) => setSelectedCustomer(cust)}
              onEditCustomer={(cust) => {
                setCustomerToEdit(cust);
                setIsAddCustomerOpen(true);
              }}
              onSendReminder={handleRemindCustomer}
            />
          )}

          {currentPage === 'follow-ups' && (
            <FollowUpsPage
              state={state}
              onOpenSendReminder={handleRemindFollowUp}
              onViewCustomerHistory={(id) => {
                const c = state.customers.find((cust) => cust.id === id);
                if (c) setSelectedCustomer(c);
              }}
            />
          )}

          {currentPage === 'promises-to-pay' && (
            <PromisesToPayPage
              state={state}
              onOpenRecordPromise={() => setIsRecordPromiseOpen(true)}
              onRecordPayment={handlePayFromPromise}
            />
          )}

          {currentPage === 'payments' && (
            <PaymentsPage
              state={state}
              onOpenRecordPayment={() => {
                const pending = state.invoices.find((i) => i.status !== 'paid');
                if (pending) setInvoiceToPay(pending);
              }}
            />
          )}

          {currentPage === 'analytics' && <AnalyticsPage state={state} />}

          {currentPage === 'team' && <TeamPage state={state} />}

          {currentPage === 'integrations' && <IntegrationsPage state={state} />}

          {currentPage === 'settings' && (
            <SettingsPage state={state} onOpenUpgrade={() => setIsUpgradeOpen(true)} />
          )}
        </main>
      </div>

      {/* --- ALL FUNCTIONAL MODALS --- */}

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        customers={state.customers}
        onInvoiceCreated={(newInv) => setSelectedInvoice(newInv)}
        currencySymbol={state.settings.currencySymbol}
      />

      {/* Invoice Detail / Printable Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        settings={state.settings}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        onRecordPayment={(inv) => {
          setSelectedInvoice(null);
          setInvoiceToPay(inv);
        }}
        onSendReminder={(inv) => {
          handleRemindInvoice(inv);
        }}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        invoice={invoiceToPay}
        isOpen={Boolean(invoiceToPay)}
        onClose={() => setInvoiceToPay(null)}
        currencySymbol={state.settings.currencySymbol}
      />

      {/* Add / Edit Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        customerToEdit={customerToEdit}
      />

      {/* Customer Profile Detail Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        invoices={state.invoices}
        payments={state.payments}
        onAddInvoice={() => {
          setSelectedCustomer(null);
          setIsCreateInvoiceOpen(true);
        }}
        onRecordPayment={(inv) => {
          setSelectedCustomer(null);
          setInvoiceToPay(inv);
        }}
        onSendReminder={(c) => {
          handleRemindCustomer(c);
        }}
        onEditCustomer={(c) => {
          setSelectedCustomer(null);
          setCustomerToEdit(c);
          setIsAddCustomerOpen(true);
        }}
        onDeleteCustomer={(id) => {
          storageService.deleteCustomer(id);
          setSelectedCustomer(null);
        }}
        currencySymbol={state.settings.currencySymbol}
      />

      {/* Send Reminder Modal */}
      {reminderData && (
        <SendReminderModal
          isOpen={Boolean(reminderData)}
          onClose={() => setReminderData(null)}
          customerName={reminderData.customerName}
          invoiceNumber={reminderData.invoiceNumber}
          amount={reminderData.amount}
          dueDate={reminderData.dueDate}
          overdueDays={reminderData.overdueDays}
          customerPhone={reminderData.customerPhone}
          currencySymbol={state.settings.currencySymbol}
        />
      )}

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        state={state}
      />

      {/* Upgrade / Pricing Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />

      {/* Record Promise to Pay Modal */}
      <RecordPromiseModal
        isOpen={isRecordPromiseOpen}
        onClose={() => setIsRecordPromiseOpen(false)}
        customers={state.customers}
        invoices={state.invoices}
        currencySymbol={state.settings.currencySymbol}
      />
    </div>
  );
}

export default function App() {
  const [payToken, setPayToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (pathname.startsWith('/pay/')) {
      const seg = pathname.replace('/pay/', '').split('/')[0];
      return seg ? seg : null;
    }
    return searchParams.get('pay');
  });

  if (payToken) {
    return (
      <CustomerPaymentPage
        token={payToken}
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          setPayToken(null);
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <CollectIQMain />
    </AuthProvider>
  );
}
