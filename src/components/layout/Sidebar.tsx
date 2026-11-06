import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  BellRing,
  Handshake,
  Receipt,
  BarChart3,
  UserCheck,
  LayoutGrid,
  Settings,
  ArrowRight,
  ChevronDown,
  Sparkles,
  LogOut,
  User,
  Shield,
  X,
} from 'lucide-react';
import { CollectIQLogo } from '../common/Graphics';
import { useAuth } from '../../context/AuthContext';

export type NavPage =
  | 'dashboard'
  | 'invoices'
  | 'customers'
  | 'follow-ups'
  | 'promises-to-pay'
  | 'payments'
  | 'analytics'
  | 'team'
  | 'integrations'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onOpenUpgrade: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  overdueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenUpgrade,
  isMobileOpen,
  onCloseMobile,
  overdueCount = 2,
}) => {
  const { currentUser, currentBusiness, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems: { id: NavPage; label: string; icon: React.ElementType; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'follow-ups', label: 'Follow-ups', icon: BellRing, badge: overdueCount },
    { id: 'promises-to-pay', label: 'Promises to Pay', icon: Handshake },
    { id: 'payments', label: 'Payments & Reconciliation', icon: Receipt },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'team', label: 'Team Management', icon: UserCheck },
    { id: 'integrations', label: 'Integrations', icon: LayoutGrid },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#f8f9fe] border-r border-[#e8e9f5] flex flex-col z-50 transition-transform duration-200 ease-in-out shrink-0 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#eef0f8]">
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
          >
            <CollectIQLogo size={38} />
          </button>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#ecebfd] text-[#4f46e5] font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#f1f2fa]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={19}
                    className={isActive ? 'text-[#4f46e5] stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span className="bg-[#ef4444] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Promo Trial Card */}
        <div className="p-4 pt-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#f2f2fe] to-[#ebeafd] border border-[#e1e0fa] p-4 text-center shadow-xs">
            {/* Top crown icon */}
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-amber-100/90 text-amber-600 flex items-center justify-center shadow-xs">
              <Sparkles size={18} className="fill-amber-400 text-amber-500" />
            </div>

            <h4 className="font-bold text-slate-800 text-sm">7 Days Free Trial</h4>
            <p className="text-slate-500 text-xs mt-0.5 mb-3">Explore all features risk-free!</p>

            <button
              onClick={onOpenUpgrade}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <span>Upgrade Now</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Logged in User Bar */}
        <div className="p-4 pt-1 border-t border-[#eef0f8] relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#edeef9] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-200">
                    {(currentUser?.displayName || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.displayName || 'Finance Lead'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  {currentUser?.role || 'Admin'} • {currentBusiness?.businessName || 'CollectIQ'}
                </span>
              </div>
            </div>
            <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* User Popover Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {currentBusiness?.businessName || 'CollectIQ Enterprise'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentUser?.email || ''}
                </p>
              </div>
              <button
                onClick={() => {
                  handleNavClick('settings');
                  setIsUserMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
              >
                <User size={14} className="text-slate-400" />
                <span>Profile & Business Settings</span>
              </button>
              <button
                onClick={() => {
                  handleNavClick('team');
                  setIsUserMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
              >
                <Shield size={14} className="text-slate-400" />
                <span>Role & Permissions</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium text-left"
              >
                <LogOut size={14} />
                <span>Log Out of CollectIQ</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
