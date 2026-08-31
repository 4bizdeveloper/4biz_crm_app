'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Server, Ticket, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard/sales');
      } else {
        setError('Invalid admin credentials. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        
        {/* Left Side: Clean Feature Cards (No Stats/Numbers) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-100 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                4Biz <span className="text-blue-600">IT CRM</span>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
              Unified Platform for IT Service & Client Management
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-md">
              Streamline sales pipelines, client project operations, technical infrastructure tickets, and staff management in one centralized hub.
            </p>

            {/* Static Clean Widgets */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Server className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">System Status</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All Systems Operational</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Service Desk</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-time Ticketing Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/60 flex items-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Enterprise Security
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Real-time Analytics
            </span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Admin Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your administrative credentials to access your workspace.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="4bizdeveloper@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 text-center">
              <p className="text-xs text-slate-400">
                Encrypted with SSL 256-bit authentication
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}