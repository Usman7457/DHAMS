import React from 'react';
import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'error'
              ? 'bg-white border-rose-300 text-rose-950 shadow-rose-950/20 ring-1 ring-rose-500/20'
              : toast.type === 'warning'
              ? 'bg-white border-amber-300 text-amber-950 shadow-amber-950/20 ring-1 ring-amber-500/20'
              : 'bg-white border-emerald-300 text-emerald-950 shadow-emerald-950/20 ring-1 ring-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                toast.type === 'error'
                  ? 'bg-rose-100 text-rose-700'
                  : toast.type === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : toast.type === 'warning' ? (
                <Clock className="w-5 h-5 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 shrink-0" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-stone-400 hover:text-stone-700 p-1.5 ml-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
