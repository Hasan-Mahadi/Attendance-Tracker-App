import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <img src="/logo-placeholder.svg" alt="AIExpertsBD" className="w-10 h-10 rounded-xl" />
          <h1 className="text-2xl font-bold tracking-tight text-white">AIExpertsBD</h1>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          Workforce Attendance & Payroll Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          AIExpertsBD Attendance System • Secured with JWT & Rotating Tokens
        </p>
      </div>
    </div>
  );
}
