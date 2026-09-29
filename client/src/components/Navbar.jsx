import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  Globe,
  Server,
  LogOut,
  ShieldCheck,
  UserCheck,
  Trash2,
} from 'lucide-react';

export function Navbar({
  currentUser,
  notifications,
  mobileMenuOpen,
  setMobileMenuOpen,
  setActiveTab,
  handleLogout,
  refreshData,
  dismissedNotifications,
  handleDismissNotifications,
}) {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notifRef = useRef(null);

  // Close notification box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeNotifCount = dismissedNotifications ? 0 : notifications.total_notifications;

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800 px-4 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-emerald-200 hover:text-white p-2 rounded-lg bg-emerald-800/60"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Clicking Logo or DHAMS text navigates to Dashboard */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Click to go to Dashboard"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-900/30 text-emerald-950 font-extrabold text-lg group-hover:scale-105 transition-transform">
            D
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight group-hover:text-amber-300 transition-colors">
              DHAMS
            </h1>
            <p className="text-xs text-emerald-200 hidden sm:block">Domain & Hosting Asset Management System</p>
          </div>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="relative p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition-all border border-emerald-700"
            title="Expiration Alerts"
          >
            <Bell className="w-5 h-5" />
            {activeNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-900 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-emerald-900">
                {activeNotifCount}
              </span>
            )}
          </button>

          {/* Notification Slide Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-stone-800">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-sm text-stone-900">Expiration Alerts (&le; 30 Days)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {dismissedNotifications ? 0 : notifications.total_notifications} Active
                  </span>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                {dismissedNotifications || notifications.items.length === 0 ? (
                  <div className="p-6 text-center text-stone-500 text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                    No active alerts or all notifications cleared for this session.
                  </div>
                ) : (
                  notifications.items.map((item, idx) => {
                    const daysLeft = parseInt(item.days_left);
                    const isExpired = daysLeft < 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          setActiveTab(item.asset_type === 'domain' ? 'domains' : 'hostings');
                        }}
                        className="p-3.5 hover:bg-stone-50 cursor-pointer transition-colors flex items-start gap-3"
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            item.asset_type === 'domain'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {item.asset_type === 'domain' ? <Globe className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-stone-900 truncate">{item.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : daysLeft <= 7
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              {isExpired ? `Expired (${Math.abs(daysLeft)}d ago)` : `${daysLeft} days left`}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 truncate">
                            Client: <span className="font-semibold text-stone-800">{item.client_name || 'N/A'}</span> ({item.client_phone})
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Expires: {new Date(item.expiry_date).toLocaleDateString()} &bull; Provider: {item.provider}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    handleDismissNotifications();
                    setShowNotificationDropdown(false);
                  }}
                  className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-800 font-bold"
                  title="Clear all alerts for this session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Alerts</span>
                </button>

                <button
                  onClick={() => {
                    setShowNotificationDropdown(false);
                    refreshData();
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold"
                >
                  Refresh Alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-emerald-800">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-white">{currentUser?.full_name || 'System Admin'}</p>
            <p className="text-[10px] text-amber-300 font-mono flex items-center justify-end gap-1">
              {currentUser?.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-amber-400 inline" /> Admin
                </>
              ) : (
                <>
                  <UserCheck className="w-3 h-3 text-emerald-300 inline" /> Viewer
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-emerald-800 hover:bg-rose-700 hover:text-white text-emerald-100 transition-all border border-emerald-700"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
