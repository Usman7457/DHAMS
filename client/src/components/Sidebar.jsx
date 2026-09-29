import React from 'react';
import {
  TrendingUp,
  Users,
  Globe,
  Server,
  UserCog,
  Building2,
  FolderGit2,
} from 'lucide-react';

export function Sidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentUser,
  clientsCount,
  domainsCount,
  hostingsCount,
  domainProvidersCount,
  hostingProvidersCount,
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-stone-100 border-r border-stone-200/80 transform transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col pt-16 lg:pt-0 shrink-0 h-full ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider px-3 mb-2">
          Management Tabs
        </div>

        {/* Dashboard */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
              : 'text-stone-700 hover:bg-amber-100/60 hover:text-amber-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        {/* Clients Directory (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => {
              setActiveTab('clients');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'clients'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'text-stone-700 hover:bg-amber-100/60 hover:text-amber-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients Directory</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 border border-stone-300 font-bold">
              {clientsCount}
            </span>
          </button>
        )}

        {/* Domains Section */}
        <div className="pt-2">
          <button
            onClick={() => {
              setActiveTab('domains');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'domains'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'text-stone-700 hover:bg-amber-100/60 hover:text-amber-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Domains</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 border border-stone-300 font-bold">
              {domainsCount}
            </span>
          </button>

          {/* Sub-tab: Domain Providers (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('domain-providers');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 pl-8 pr-3.5 py-2 mt-1 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'domain-providers'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Domain Providers</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                {domainProvidersCount}
              </span>
            </button>
          )}
        </div>

        {/* Hostings Section */}
        <div className="pt-2">
          <button
            onClick={() => {
              setActiveTab('hostings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'hostings'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'text-stone-700 hover:bg-amber-100/60 hover:text-amber-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Hostings</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 border border-stone-300 font-bold">
              {hostingsCount}
            </span>
          </button>

          {/* Sub-tab: Hosting Providers (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('hosting-providers');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 pl-8 pr-3.5 py-2 mt-1 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'hosting-providers'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Hosting Providers</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                {hostingProvidersCount}
              </span>
            </button>
          )}
        </div>

        {/* System Users Tab (Admin Only) */}
        {isAdmin && (
          <div className="pt-3">
            <button
              onClick={() => {
                setActiveTab('users');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'text-stone-700 hover:bg-amber-100/60 hover:text-amber-900'
              }`}
            >
              <UserCog className="w-4 h-4" />
              <span>System Users</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold uppercase">
                Admin
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Requirement #3: Updated Footer Text */}
      <div className="p-4 border-t border-stone-200 text-xs text-stone-600 text-center font-bold">
        DH Asset Management System
      </div>
    </aside>
  );
}
