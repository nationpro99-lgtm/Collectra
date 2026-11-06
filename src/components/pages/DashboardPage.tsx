import React from 'react';
import { AppState } from '../../services/storage';
import { Header3DBarGraphic } from '../common/Graphics';
import { MetricCards } from '../dashboard/MetricCards';
import { CashFlowChart } from '../dashboard/CashFlowChart';
import { UpcomingFollowUps } from '../dashboard/UpcomingFollowUps';
import { AIAssistantCard } from '../dashboard/AIAssistantCard';
import { TopCustomers } from '../dashboard/TopCustomers';
import { InvoiceStatusDonut } from '../dashboard/InvoiceStatusDonut';
import { RecentActivity } from '../dashboard/RecentActivity';
import { QuickActions } from '../dashboard/QuickActions';
import { PromiseToPayCard } from '../dashboard/PromiseToPayCard';
import { MyTasksCard } from '../dashboard/MyTasksCard';
import { UpgradeCard } from '../dashboard/UpgradeCard';
import { CollectionInsightsCard } from '../dashboard/CollectionInsightsCard';
import { FollowUp, Customer, PromiseToPay } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DashboardPageProps {
  state: AppState;
  onNavigate: (page: any) => void;
  onOpenUpgrade: () => void;
  onOpenAIAssistant: () => void;
  onRemindFollowUp: (followUp: FollowUp) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectPromise: (promise: PromiseToPay) => void;
  onToggleTask: (id: string) => void;
  onAddInvoice: () => void;
  onAddCustomer: () => void;
  onSendReminderQuick: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  state,
  onNavigate,
  onOpenUpgrade,
  onOpenAIAssistant,
  onRemindFollowUp,
  onSelectCustomer,
  onSelectPromise,
  onToggleTask,
  onAddInvoice,
  onAddCustomer,
  onSendReminderQuick,
}) => {
  const { currentUser } = useAuth();
  const userName = currentUser?.displayName?.split(' ')[0] || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome Banner matching reference image */}
      <div className="relative flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{greeting}, {userName}!</span>
            <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Here's your collection overview for this month.
          </p>
        </div>

        {/* 3D Decorative Bar Graphic matching top right of reference image */}
        <div className="hidden sm:block absolute right-0 top-0 -translate-y-2 pointer-events-none">
          <Header3DBarGraphic className="w-48 h-28" />
        </div>
      </div>

      {/* 4 Financial Summary Cards */}
      <MetricCards state={state} />

      {/* Second Row: Cash Flow Overview, Upcoming Follow-ups, AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <CashFlowChart state={state} />
        </div>
        <div className="lg:col-span-4">
          <UpcomingFollowUps
            followUps={state.followUps}
            onRemind={onRemindFollowUp}
            onViewAll={() => onNavigate('follow-ups')}
            currencySymbol={state.settings.currencySymbol}
          />
        </div>
        <div className="lg:col-span-3">
          <AIAssistantCard
            state={state}
            onViewDetails={onOpenAIAssistant}
            onGenerateReminders={() => onNavigate('follow-ups')}
          />
        </div>
      </div>

      {/* Third Row: Top Customers, Invoice Status, Recent Activity, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-4">
          <TopCustomers
            customers={state.customers}
            onViewAll={() => onNavigate('customers')}
            onSelectCustomer={onSelectCustomer}
            currencySymbol={state.settings.currencySymbol}
          />
        </div>
        <div className="xl:col-span-3">
          <InvoiceStatusDonut state={state} />
        </div>
        <div className="xl:col-span-3">
          <RecentActivity
            activities={state.activities}
            onViewAll={() => onNavigate('payments')}
          />
        </div>
        <div className="xl:col-span-2">
          <QuickActions
            onAddInvoice={onAddInvoice}
            onSendReminder={onSendReminderQuick}
            onAddCustomer={onAddCustomer}
            onViewReports={() => onNavigate('analytics')}
          />
        </div>
      </div>

      {/* Bottom Row: Promise-to-Pay Tracker, My Tasks, Upgrade Card, Collection Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-3">
          <PromiseToPayCard
            promises={state.promisesToPay}
            onViewAll={() => onNavigate('promises-to-pay')}
            onSelectPromise={onSelectPromise}
          />
        </div>
        <div className="xl:col-span-3">
          <MyTasksCard
            tasks={state.tasks}
            onToggleTask={onToggleTask}
            onViewAll={() => onNavigate('dashboard')}
          />
        </div>
        <div className="xl:col-span-3">
          <UpgradeCard onUpgrade={onOpenUpgrade} />
        </div>
        <div className="xl:col-span-3">
          <CollectionInsightsCard state={state} />
        </div>
      </div>
    </div>
  );
};
