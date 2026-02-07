import { createClient } from '@/utils/supabase/server'
import { Activity, Trash2, Calendar, Search } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  
  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  
  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // 2. Fetch Logs with Filter
  let query = supabase
    .from('user_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (q) {
    query = query.ilike('user_email', `%${q}%`)
  }

  const { data: logs } = await query

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 text-white rounded-lg">
            <Activity size={24} />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
             <p className="text-sm text-gray-500">Tracking every critical system change (Last 90 days policy)</p>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input 
            name="q"
            defaultValue={q}
            placeholder="Search by user email..." 
            className="pl-10 w-full border rounded-lg p-2 text-sm"
        />
      </form>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs?.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {log.user_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {log.resource_type || '-'}
                </td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}