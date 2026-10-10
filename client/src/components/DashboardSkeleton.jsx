import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  Users,
  Globe,
  Server,
  AlertTriangle,
  BarChart3,
  Layers,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';

export function DashboardSkeleton({ isAdmin = true, currentUser }) {
  return (
    <SkeletonTheme baseColor="#eae5dc" highlightColor="#f7f4ee">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header / Welcome Banner Skeleton */}
        {!isAdmin ? (
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Welcome, {currentUser?.fullName || currentUser?.full_name || currentUser?.username || 'User'}!
              </h2>
              <p className="text-xs text-emerald-200 mt-1">
                Loading your assigned domain and hosting assets...
              </p>
            </div>
            <button
              disabled
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700/50 text-xs font-bold text-white border border-emerald-600/50 shadow-sm shrink-0 cursor-not-allowed opacity-80"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading...</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">System Dashboard</h2>
              <p className="text-xs text-stone-500">Loading clients, domains, hostings & expiration analytics...</p>
            </div>
            <button
              disabled
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-xs font-bold text-stone-400 border border-stone-200 shadow-sm opacity-80 cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>Loading...</span>
            </button>
          </div>
        )}

        {/* KPI Cards Grid Skeleton */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {isAdmin && (
            <div className="glass-card p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Customers</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Users className="w-5 h-5 opacity-60" />
                </div>
              </div>
              <div className="my-1">
                <Skeleton width={60} height={28} borderRadius={8} />
              </div>
              <div className="mt-2">
                <Skeleton width={140} height={13} borderRadius={4} />
              </div>
            </div>
          )}

          <div className="glass-card p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {isAdmin ? 'Total Domains' : 'Your Domains'}
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Globe className="w-5 h-5 opacity-60" />
              </div>
            </div>
            <div className="my-1">
              <Skeleton width={60} height={28} borderRadius={8} />
            </div>
            <div className="mt-2">
              <Skeleton width={130} height={13} borderRadius={4} />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {isAdmin ? 'Total Hostings' : 'Your Hostings'}
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                <Server className="w-5 h-5 opacity-60" />
              </div>
            </div>
            <div className="my-1">
              <Skeleton width={60} height={28} borderRadius={8} />
            </div>
            <div className="mt-2">
              <Skeleton width={130} height={13} borderRadius={4} />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Critical Expiration Alerts</span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5 opacity-60" />
              </div>
            </div>
            <div className="my-1">
              <Skeleton width={60} height={28} borderRadius={8} />
            </div>
            <div className="mt-2">
              <Skeleton width={135} height={13} borderRadius={4} />
            </div>
          </div>
        </div>

        {/* DASHBOARD VISUAL GRAPHS SKELETON (ADMIN ONLY) */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRAPH 1 SKELETON */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-700 opacity-60" />
                  <span className="font-bold text-sm text-stone-900">System Resource Overview</span>
                </div>
                <Skeleton width={110} height={22} borderRadius={999} />
              </div>
              <div className="h-64 w-full pt-2 flex items-end justify-around px-4 pb-2">
                {/* Simulated Chart Bars Skeleton */}
                <div className="flex flex-col items-center gap-2 w-12">
                  <Skeleton height={140} width={36} borderRadius={6} />
                  <Skeleton height={12} width={45} borderRadius={4} />
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <Skeleton height={180} width={36} borderRadius={6} />
                  <Skeleton height={12} width={45} borderRadius={4} />
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <Skeleton height={160} width={36} borderRadius={6} />
                  <Skeleton height={12} width={45} borderRadius={4} />
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <Skeleton height={70} width={36} borderRadius={6} />
                  <Skeleton height={12} width={55} borderRadius={4} />
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <Skeleton height={40} width={36} borderRadius={6} />
                  <Skeleton height={12} width={45} borderRadius={4} />
                </div>
              </div>
            </div>

            {/* GRAPH 2 SKELETON */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-700 opacity-60" />
                  <span className="font-bold text-sm text-stone-900">Assets per Client / Customer</span>
                </div>
                <Skeleton width={95} height={22} borderRadius={999} />
              </div>
              <div className="h-64 w-full pt-2 flex items-end justify-around px-4 pb-2">
                {/* Simulated Clustered Bars Skeleton */}
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="flex items-end gap-1">
                      <Skeleton height={60 + idx * 22} width={14} borderRadius={4} />
                      <Skeleton height={40 + idx * 18} width={14} borderRadius={4} />
                    </div>
                    <Skeleton height={12} width={28} borderRadius={4} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GRAPH 3 & WARNING FEED SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRAPH 3 SKELETON: Donut */}
          {isAdmin && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3 lg:col-span-1">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-emerald-700 opacity-60" />
                  <span className="font-bold text-sm text-stone-900">Asset Status Ratio</span>
                </div>
              </div>
              <div className="h-64 w-full flex flex-col items-center justify-center gap-3">
                <div className="relative flex items-center justify-center">
                  <Skeleton circle width={140} height={140} />
                  <div className="absolute w-16 h-16 rounded-full bg-white shadow-inner" />
                </div>
                <div className="flex gap-2">
                  <Skeleton width={60} height={14} borderRadius={4} />
                  <Skeleton width={60} height={14} borderRadius={4} />
                </div>
              </div>
            </div>
          )}

          {/* Expiring Alerts Table List Skeleton */}
          <div className={`bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 opacity-60" />
                <span className="text-sm font-bold text-stone-900">Daily Expiration Alert Feed (&le; 30 Days)</span>
              </div>
              <Skeleton width={90} height={16} borderRadius={4} />
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
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
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i} className="hover:bg-stone-50/50">
                      <td className="py-3 px-3">
                        <Skeleton width={65} height={20} borderRadius={6} />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton width={120} height={16} borderRadius={4} />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton width={90} height={14} borderRadius={4} />
                        <Skeleton width={65} height={10} borderRadius={4} className="mt-1" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton width={75} height={14} borderRadius={4} />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton width={70} height={20} borderRadius={6} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Skeleton width={50} height={24} borderRadius={6} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
