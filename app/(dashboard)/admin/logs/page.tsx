import { createClient } from '@/utils/supabase/server'
import { ShieldAlert, Activity } from 'lucide-react'

export default async function AdminLogsPage() {
  const supabase = await createClient()
  
  // 1. Check if User is Admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-red-600 gap-4">
        <ShieldAlert size={64} />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You do not have permission to view System Logs.</p>
      </div>
    )
  }

  // 2. Fetch Logs
  const { data: logs } = await supabase
    .from('user_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-800 rounded-full text-white">
          <Activity size={24} />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
           <p className="text-sm text-gray-500">Tracking user activity (Last 100 records)</p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {log.user_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                  {log.action}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.details || '-'}
                </td>
              </tr>
            ))}
            {logs?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}