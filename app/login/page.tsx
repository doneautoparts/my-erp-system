import { login, signup } from './actions'
import { Package, ShoppingCart, TrendingUp, BarChart3, ShieldCheck, Truck } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 flex flex-col justify-center items-center p-4 md:p-8">
      
      {/* --- 1. INTRODUCTION SECTION --- */}
      <div className="max-w-3xl text-center mb-10 space-y-6">
        <div className="inline-block p-3 rounded-full bg-blue-100 text-blue-700 mb-2 shadow-sm">
          <Truck size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          MY ERP <span className="text-blue-600">System</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The complete digital solution for automotive parts management. 
          Streamline your inventory, automate purchasing, and track sales performance in one secure platform.
        </p>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-700">
            <Package size={16} className="text-blue-500" /> Smart Inventory
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-700">
            <ShoppingCart size={16} className="text-green-500" /> Purchasing
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-700">
            <TrendingUp size={16} className="text-indigo-500" /> Sales Tracking
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-700">
            <BarChart3 size={16} className="text-purple-500" /> Analytics
          </div>
        </div>
      </div>

      {/* --- 2. LOGIN CARD --- */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 relative">
        
        {/* Decorative Top Border */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="p-8">
          <div className="flex items-center justify-center gap-2 mb-8 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Secure Access Portal
          </div>

          <form className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@company.com"
                  className="block w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <button
                formAction={login}
                className="w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
              >
                Sign In to Dashboard
              </button>
              
              <div className="relative flex items-center">
                 <div className="flex-grow border-t border-slate-200"></div>
                 <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">New Staff?</span>
                 <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                formAction={signup}
                className="w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              >
                Register Account
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} Done Auto Parts. Authorized personnel only.
            </p>
        </div>
      </div>
      
    </div>
  )
}