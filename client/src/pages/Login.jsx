import React, { useState } from 'react';
import { ShieldCheck, User, Key, RefreshCw, AlertTriangle } from 'lucide-react';
import { ToastContainer } from '../components/Toast';

export function Login({ handleLogin, loginLoading, loginError, toasts, removeToast }) {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const onSubmit = (e) => {
    e.preventDefault();
    handleLogin(loginForm);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-stone-200">
          {/* Header / Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 mb-4 shadow-md shadow-emerald-700/10">
              <ShieldCheck className="w-9 h-9 text-emerald-700" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Domain & Hosting <br /><span className="text-emerald-700">Asset Management System</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">By Sheikh Muhammad Usman Ghani</p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2.5 pl-11 pr-4 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Key className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2.5 pl-11 pr-4 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
