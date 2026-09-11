'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Server, 
  Ticket, 
  ArrowRight, 
  Lock, 
  Mail, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Activity, 
  BarChart3, 
  Zap,
  Globe
} from 'lucide-react';

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
        router.push('/dashboard/overview');
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
    <div className="relative min-h-screen w-full bg-[#020a0a] text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-[#288277]/30 selection:text-[#52d6c1]">
      
      {/* Background Glows & Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#1d5c58]/20 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#0c2f2e]/30 rounded-full blur-[160px] pointer-events-none translate-y-1/2" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d2d2c10_1px,transparent_1px),linear-gradient(to_bottom,#0d2d2c10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header / Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#1b4e4c] to-[#0c2827] text-[#52d6c1] p-2.5 rounded-xl border border-[#2a6d68]/40 shadow-lg shadow-[#123937]/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl sm:text-2xl text-white tracking-tight">
            4Biz <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42b8a6] to-[#7ce3d2]">IT CRM</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c2323]/80 border border-[#1b4341]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Status: 99.98%
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Globe className="w-4 h-4 text-[#42b8a6]" /> Global Cloud Network
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Landing Page Content & Visual CRM Showcase */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f2d2c]/80 border border-[#1f5653] text-[#52d6c1] text-xs font-semibold mb-4 backdrop-blur-md">
                <Zap className="w-3.5 h-3.5" /> Next-Gen Enterprise Solution
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Intelligent Control Center for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42b8a6] via-[#65dbca] to-[#99f3e4]">IT Operations</span> & Clients
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-4 max-w-xl">
                Accelerate business pipelines, automate technical workflows, monitor real-time server infrastructure, and elevate client satisfaction with our unified CRM suite.
              </p>
            </div>

            {/* Simulated Live Analytics Cards Showcase */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-b from-[#0e2726]/90 to-[#081818]/90 backdrop-blur-xl p-4 rounded-xl border border-[#1d4a47]/60 shadow-xl relative overflow-hidden group hover:border-[#2a6d68] transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-12 h-12 text-[#52d6c1]" />
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue Pipeline</p>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">₹ 42.5 L</h3>
                <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium mt-1">
                  +18.4% this month
                </span>
              </div>

              <div className="bg-gradient-to-b from-[#0e2726]/90 to-[#081818]/90 backdrop-blur-xl p-4 rounded-xl border border-[#1d4a47]/60 shadow-xl relative overflow-hidden group hover:border-[#2a6d68] transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-12 h-12 text-[#52d6c1]" />
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Clients</p>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">1,280+</h3>
                <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium mt-1">
                  Active SLA contracts
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-gradient-to-b from-[#0e2726]/90 to-[#081818]/90 backdrop-blur-xl p-4 rounded-xl border border-[#1d4a47]/60 shadow-xl relative overflow-hidden group hover:border-[#2a6d68] transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity className="w-12 h-12 text-[#52d6c1]" />
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Service Desk</p>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">98.2%</h3>
                <span className="inline-flex items-center text-[10px] text-[#52d6c1] font-medium mt-1">
                  Resolution rate
                </span>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0a1f1e]/60 border border-[#163e3b]/50">
                <div className="p-2 rounded-lg bg-[#143d3a] text-[#52d6c1] shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Infrastructure Tickets</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automated queue routing and live server monitoring.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0a1f1e]/60 border border-[#163e3b]/50">
                <div className="p-2 rounded-lg bg-[#143d3a] text-[#52d6c1] shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Real-Time Analytics</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">In-depth insights into team output and sales conversion.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Login Card */}
          <div className="lg:col-span-5 w-full">
            <div className="relative bg-gradient-to-b from-[#0d2625]/95 to-[#061414]/95 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl border border-[#215450]/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
              
              {/* Subtle Ambient Card Gradient */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#22726a]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Admin Sign In</h2>
                <p className="text-xs text-slate-400 mt-1.5">
                  Enter your credentials to access the administrative workstation.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-medium text-center backdrop-blur-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@4biz.com"
                      className="w-full pl-10 pr-4 py-3 bg-[#071717]/90 border border-[#1f4e4b] rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#37a395] focus:border-transparent transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-[#071717]/90 border border-[#1f4e4b] rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#37a395] focus:border-transparent transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#184d4b] via-[#226863] to-[#2c837c] hover:from-[#1d5c5a] hover:to-[#359b92] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#103836]/60 border border-[#3ba095]/40 flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#173e3c]/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#52d6c1]" /> SSL 256-bit Encrypted
                </span>
                <span className="text-slate-400">v4.8.2 Enterprise</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} 4Biz IT CRM System. All rights reserved.</p>
      </footer>

    </div>
  );
}