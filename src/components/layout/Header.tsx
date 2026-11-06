import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Globe,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  Check,
  FileText,
  Users,
  CreditCard,
  X,
} from 'lucide-react';
import { NavPage } from './Sidebar';
import { AppState } from '../../services/storage';

interface HeaderProps {
  onNavigate: (page: NavPage) => void;
  onToggleMobileMenu: () => void;
  state: AppState;
  onSelectInvoice?: (id: string) => void;
  onSelectCustomer?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onToggleMobileMenu,
  state,
  onSelectInvoice,
  onSelectCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [unreadNotifications, setUnreadNotifications] = useState(
    state.activities.length > 0 ? Math.min(state.activities.length, 3) : 0
  );

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching invoices & customers
  const trimmed = searchQuery.trim().toLowerCase();
  const matchedInvoices = trimmed
    ? state.invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(trimmed) ||
          i.customerName.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const matchedCustomers = trimmed
    ? state.customers.filter(
        (c) =>
          c.name.toLowerCase().includes(trimmed) ||
          c.company.toLowerCase().includes(trimmed) ||
          c.email.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const languages = ['English', 'Hindi (हिंदी)', 'Spanish (Español)', 'German (Deutsch)'];

  const notificationsList = state.activities.map((act) => ({
    id: act.id,
    title: act.title,
    desc: act.description,
    time: act.timestamp,
    unread: false,
    type: act.type,
  }));

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-md border-b border-[#ececf7] px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative flex items-center">
            <Search
              size={18}
              className="absolute left-3.5 text-slate-400 pointer-events-none stroke-[2]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search invoices, customers..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#f8f9fe] border border-[#e4e5f4] text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 max-h-96 overflow-y-auto divide-y divide-slate-100">
                {matchedInvoices.length === 0 && matchedCustomers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No matching invoices or customers found for "{searchQuery}"
                  </div>
                ) : (
                  <>
                    {matchedInvoices.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <FileText size={12} />
                          <span>Invoices</span>
                        </div>
                        {matchedInvoices.map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => {
                              onNavigate('invoices');
                              onSelectInvoice?.(inv.id);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-indigo-50/50 rounded-lg flex items-center justify-between cursor-pointer group"
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                                {inv.invoiceNumber}
                              </span>
                              <span className="text-xs text-slate-500 ml-2">
                                {inv.customerName}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              ₹{inv.amount.toLocaleString('en-IN')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {matchedCustomers.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Users size={12} />
                          <span>Customers</span>
                        </div>
                        {matchedCustomers.map((cust) => (
                          <button
                            key={cust.id}
                            onClick={() => {
                              onNavigate('customers');
                              onSelectCustomer?.(cust.id);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-indigo-50/50 rounded-lg flex items-center justify-between cursor-pointer group"
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                                {cust.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {cust.company}
                              </span>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                              Bal: ₹{cust.outstandingBalance.toLocaleString('en-IN')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setUnreadNotifications(0);
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-[#f2f3fc] transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={20} className="stroke-[1.8]" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                <span className="text-sm font-bold text-slate-800">Notifications</span>
                <span className="text-[11px] text-indigo-600 font-medium">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notificationsList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    No new notifications
                  </div>
                ) : (
                  notificationsList.map((n) => (
                    <div key={n.id} className="py-2.5 px-1 hover:bg-slate-50/80 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{n.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div ref={langRef} className="relative hidden sm:block">
          <button
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            className="h-10 px-3 rounded-xl border border-[#e4e5f4] bg-[#f8f9fe] hover:bg-[#f2f3fc] flex items-center gap-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Globe size={16} className="text-slate-500" />
            <span>{selectedLanguage}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isLanguageOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSelectedLanguage(lang.split(' ')[0]);
                    setIsLanguageOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-indigo-50 flex items-center justify-between cursor-pointer"
                >
                  <span>{lang}</span>
                  {selectedLanguage === lang.split(' ')[0] && <Check size={14} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings Shortcut Button */}
        <button
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-[#f2f3fc] transition-colors cursor-pointer"
          title="Settings"
          aria-label="Settings shortcut"
        >
          <SettingsIcon size={20} className="stroke-[1.8]" />
        </button>
      </div>
    </header>
  );
};
