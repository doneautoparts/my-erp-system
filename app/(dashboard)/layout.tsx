import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  FileText, 
  LogOut,
  CreditCard,
  BarChart3,
  Activity,
  Shield
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from './actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Get Profile Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'user' // default to user
  const isAdmin = role === 'admin'
  // const isManager = role === 'manager' || role === 'admin' // If needed later

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider">MY ERP</h1>
          <p className="text-xs text-gray-400 mt-1">Enterprise System</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/inventory" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Package size={20} />
            <span>Inventory</span>
          </Link>
          <Link href="/purchasing" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <ShoppingCart size={20} />
            <span>Purchasing</span>
          </Link>
          <Link href="/sales" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <TrendingUp size={20} />
            <span>Sales</span>
          </Link>
          <Link href="/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <CreditCard size={20} />
            <span>Payments</span>
          </Link>
          <Link href="/customers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Users size={20} />
            <span>Customers</span>
          </Link>
          <Link href="/documents" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <FileText size={20} />
            <span>Documents</span>
          </Link>
          
          <Link href="/analysis" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <BarChart3 size={20} />
            <span>Analysis Order</span>
          </Link>

          <Link href="/reports" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <FileText size={20} />
            <span>Reports (LHDN)</span>
          </Link>

          {/* ADMIN ONLY LINKS */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 text-xs font-bold text-gray-500 px-4 uppercase">Admin Tools</div>
              
              <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-indigo-200">
                <Shield size={20} />
                <span>Manage Users</span>
              </Link>

              <Link href="/admin/logs" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-indigo-200">
                <Activity size={20} />
                <span>Admin Logs</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-white">{user.email}</p>
              <p className="text-xs capitalize">{role}</p>
            </div>
          </div>
          <form action={signOut}>
             <button className="flex w-full items-center gap-3 px-4 py-2 mt-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors text-sm">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  )
}