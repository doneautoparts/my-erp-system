import { createClient } from '@/utils/supabase/server'
import { Shield, Trash2, UserPlus, Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { deleteUser, updateUserRole, toggleApproval } from './actions'

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  let profiles: any[] = []
  let fetchError = null

  try {
    const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
    
    if (dbError) throw dbError
    profiles = data || []
  } catch (err: any) {
    fetchError = err.message
  }

  const { data: { user } } = await supabase.auth.getUser()
  const currentUserRole = profiles.find(p => p.id === user?.id)?.role || 'user'

  if (currentUserRole !== 'admin') {
    return (
      <div className="p-8 text-center text-red-600">
        <Shield size={48} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>Only Admins can manage users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
          <Shield size={24} />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-gray-900">User Administration</h1>
           <p className="text-sm text-gray-500">Approve new users and manage roles.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">Error: {error}</div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">User Email</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-bold text-gray-900">{profile.email}</div>
                  <div className="text-xs text-gray-400">Joined: {new Date(profile.created_at).toLocaleDateString()}</div>
                </td>
                
                {/* APPROVAL STATUS */}
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
                
                {/* ROLE EDITOR */}
                <td className="px-4 py-3">
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={profile.id} />
                    <select 
                      name="role" 
                      defaultValue={profile.role} 
                      className={`border rounded p-1 text-xs font-bold uppercase cursor-pointer ${
                        profile.role === 'admin' ? 'text-red-600 border-red-200 bg-red-50' : 
                        profile.role === 'manager' ? 'text-blue-600 border-blue-200 bg-blue-50' : 
                        'text-gray-600 border-gray-200 bg-gray-50'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="text-gray-400 hover:text-green-600 p-1" title="Save Role"><Save size={16} /></button>
                  </form>
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                  {/* Approval Toggle */}
                  {profile.id !== user?.id && (
                      <form action={toggleApproval}>
                        <input type="hidden" name="id" value={profile.id} />
                        <input type="hidden" name="current_status" value={String(profile.is_approved)} />
                        <button 
                            className={`p-1 rounded ${profile.is_approved ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={profile.is_approved ? "Revoke Access" : "Approve User"}
                        >
                            {profile.is_approved ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </form>
                  )}

                  {/* Delete */}
                  {profile.id !== user?.id && (
                    <form action={deleteUser} onSubmit={(e) => { if(!confirm('Delete this user?')) e.preventDefault() }}>
                      <input type="hidden" name="id" value={profile.id} />
                      <button className="text-gray-300 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Delete"><Trash2 size={16} /></button>
                    </form>
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