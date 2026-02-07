import { createClient } from '@/utils/supabase/server'
import { Shield, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { deleteUser, toggleApproval } from './actions'

// 1. Force Dynamic Rendering (Fixes caching/static issues)
export const dynamic = 'force-dynamic'

export default async function UserManagementPage() {
  const supabase = await createClient()
  
  // 2. Safe Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 3. Admin Check
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = currentUserProfile?.role || 'user'

  if (userRole !== 'admin') {
    return <div className="p-10 text-center text-red-600 font-bold">Access Denied: Admins Only</div>
  }

  // 4. Fetch Profiles (Specific Columns Only to prevent data errors)
  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, email, role, is_approved, created_at')
    .order('created_at', { ascending: false })

  if (dbError) {
    return <div className="p-10 text-center text-orange-600">Database Error: {dbError.message}</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
          <Shield size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">User Administration (Safe Mode)</h1>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(profiles || []).map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-bold text-gray-900">{profile.email}</div>
                  <div className="text-xs text-gray-400">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown Date'}
                  </div>
                </td>
                
                <td className="px-4 py-3 text-center">
                   {profile.is_approved ? (
                     <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                       <CheckCircle size={12} /> Active
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                       <AlertTriangle size={12} /> Pending
                     </span>
                   )}
                </td>
                
                {/* Simplified Role Display (No Edit for now) */}
                <td className="px-4 py-3 uppercase font-bold text-gray-700">
                  {profile.role}
                </td>

                <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                  {profile.id !== user.id && (
                    <>
                        <form action={toggleApproval}>
                          <input type="hidden" name="id" value={profile.id} />
                          <input type="hidden" name="current_status" value={String(profile.is_approved)} />
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Toggle Status">
                            {profile.is_approved ? <XCircle size={18} /> : <CheckCircle size={18} />}
                          </button>
                        </form>

                        <form action={deleteUser}>
                            <input type="hidden" name="id" value={profile.id} />
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}