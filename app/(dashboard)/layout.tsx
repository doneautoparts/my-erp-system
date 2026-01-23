import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  FileText, 
  LogOut 
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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider">MY ERP</h1>
          <p className="text-xs text-gray-400 mt-1">Enterprise System</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
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
          <Link href="/reports" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <FileText size={20} />
            <span>Reports (LHDN)</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-white">{user.email}</p>
              <p className="text-xs">User</p>
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