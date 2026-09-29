import React, { useMemo } from 'react';
import {
  Users,
  Globe,
  Server,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Layers,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export function DashboardPage({
  stats,
  clients,
  domains,
  hostings,
  notifications,
  setActiveTab,
  refreshData,
  currentUser,
}) {
  const isAdmin = currentUser?.role === 'admin';

  // Graph 1 Data: System Asset Summary
  const assetSummaryData = [
    { name: 'Clients', count: stats.total_clients, fill: '#059669' },
    { name: 'Domains', count: stats.total_domains, fill: '#0284C7' },
    { name: 'Hostings', count: stats.total_hostings, fill: '#D97706' },
    { name: 'Expiring (30d)', count: stats.expiring_domains + stats.expiring_hostings, fill: '#E11D48' },
    { name: 'Expired', count: stats.expired_domains + stats.expired_hostings, fill: '#991B1B' },
  ];

  // Graph 2 Data: Assets Per Client (Domains vs Hostings per Customer)
  const clientAssetsData = useMemo(() => {
    return clients.map((c) => {
      const parts = (c.name || '').trim().split(/\s+/);
      let initials = '';
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts[0] && parts[0].length >= 2) {
        initials = parts[0].substring(0, 2).toUpperCase();
      } else if (parts[0]) {
        initials = parts[0].toUpperCase();
      }
      return {
        name: initials || 'N/A',
        fullName: c.name,
        Domains: c.domain_count || 0,
        Hostings: c.hosting_count || 0,
      };
    });
  }, [clients]);

  // Graph 3 Data: Asset Status Ratio Donut
  const activeDomains = Math.max(0, stats.total_domains - stats.expiring_domains - stats.expired_domains);
  const activeHostings = Math.max(0, stats.total_hostings - stats.expiring_hostings - stats.expired_hostings);

  const assetStatusData = [
    { name: 'Active Domains', value: activeDomains, color: '#10B981' },
    { name: 'Expiring Domains', value: stats.expiring_domains, color: '#F59E0B' },
    { name: 'Expired Domains', value: stats.expired_domains, color: '#EF4444' },
    { name: 'Active Hostings', value: activeHostings, color: '#6366F1' },
    { name: 'Expiring Hostings', value: stats.expiring_hostings, color: '#F97316' },
    { name: 'Expired Hostings', value: stats.expired_hostings, color: '#991B1B' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header / Welcome Banner */}
      {!isAdmin ? (
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Welcome, {currentUser?.fullName || currentUser?.full_name || currentUser?.username}!
            </h2>
            <p className="text-xs text-emerald-200 mt-1">
              Here is the overview of your assigned domain and hosting assets.
            </p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-xs font-bold text-white border border-emerald-600 shadow-sm transition-all shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">System Dashboard</h2>
            <p className="text-xs text-stone-500">Overview of clients, domains, hostings & expiration analytics</p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 border border-stone-200 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Refresh Data</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {isAdmin && (
          <div className="glass-card p-5 rounded-2xl border border-stone-200 hover:border-emerald-600 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Customers</span>
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-stone-900">{stats.total_clients}</div>
            <div className="text-[11px] text-stone-500 mt-1">Registered clients in database</div>
          </div>
        )}

        <div className="glass-card p-5 rounded-2xl border border-stone-200 hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isAdmin ? 'Total Domains' : 'Your Domains'}
            </span>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900">{stats.total_domains}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {stats.expiring_domains} expiring in 30 days
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-stone-200 hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isAdmin ? 'Total Hostings' : 'Your Hostings'}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900">{stats.total_hostings}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {stats.expiring_hostings} expiring in 30 days
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-stone-200 hover:border-rose-500 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Critical Expiration Alerts</span>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{stats.total_alerts}</div>
          <div className="text-[11px] text-rose-700/80 mt-1">Requires renewal action</div>
        </div>
      </div>

      {/* DASHBOARD VISUAL GRAPHS SECTION (ADMIN ONLY) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GRAPH 1: System Resource Overview Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-900">System Resource Overview</h3>
              </div>
              <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                Resource Distribution
              </span>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetSummaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DECE" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#57534E' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#57534E' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E7DECE', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {assetSummaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPH 2: Customers vs Domains & Hostings per Client */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-sm text-stone-900">Assets per Client / Customer</h3>
              </div>
              <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                Client Allocation
              </span>
            </div>
            <div className="h-64 w-full pt-2">
              {clientAssetsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400">
                  No clients registered yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientAssetsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DECE" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#57534E' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#57534E' }} />
                    <Tooltip
                      labelFormatter={(label, payload) => {
                        const item = payload && payload[0] && payload[0].payload;
                        return item ? `${item.fullName} (${label})` : label;
                      }}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E7DECE', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Domains" fill="#0284C7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Hostings" fill="#D97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GRAPH 3 & WARNING FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPH 3: Asset Status Donut Chart (Admin Only) */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3 lg:col-span-1">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-900">Asset Status Ratio</h3>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {assetStatusData.length === 0 ? (
                <div className="text-xs text-stone-400">No active assets data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {assetStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E7DECE', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} layout="horizontal" align="center" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Expiring Alerts Table List */}
        <div className={`bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900">Daily Expiration Alert Feed (&le; 30 Days)</h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {notifications.items.length > 5 ? `5 Visible (Total: ${notifications.items.length})` : 'Auto-notifies before expiry'}
            </span>
          </div>

          {notifications.items.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-stone-800">All Assets Healthy</p>
              <p className="text-xs text-stone-500 mt-0.5">No domains or hostings are due to expire within the next 30 days.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[285px] border border-stone-200 rounded-xl shadow-inner scrollbar-thin">
              <table className="w-full text-left text-xs text-stone-700 relative border-collapse">
                <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Asset Title</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {notifications.items.map((item, idx) => {
                    const daysLeft = parseInt(item.days_left);
                    const isExpired = daysLeft < 0;

                    return (
                      <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                              item.asset_type === 'domain'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {item.asset_type === 'domain' ? <Globe className="w-3 h-3" /> : <Server className="w-3 h-3" />}
                            {item.asset_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-stone-900">{item.title}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold">{item.client_name || 'N/A'}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{item.client_phone}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{new Date(item.expiry_date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              isExpired
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : daysLeft <= 7
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isExpired ? `EXPIRED (${Math.abs(daysLeft)}d)` : `${daysLeft}d left`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setActiveTab(item.asset_type === 'domain' ? 'domains' : 'hostings')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shadow-sm transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
