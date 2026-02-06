import { createClient } from '@/utils/supabase/server'
import { Shield, Trash2, UserPlus, Save, AlertTriangle } from 'lucide-react'
import { deleteUser, updateUserRole, createUser } from './actions'

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  let profiles: any[] = []
  let fetchError = null

  // 1. Safe Data Fetching
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

  // 2. Check Current User Role
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
           <p className="text-sm text-gray-500">Manage access levels (Admin / Manager / User)</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          Error: {error}
        </div>
      )}

      {fetchError && (
        <div className="p-4 bg-orange-50 text-orange-800 border border-orange-200 rounded-md flex items-center gap-2">
            <AlertTriangle size={20} />
            <div>
                <p className="font-bold">Database Error</p>
                <p className="text-sm">{fetchError}</p>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: INSTRUCTION CARD (Replaced the complex Create form) */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={18} /> Add New User
          </h2>
          
          <div className="text-sm text-gray-600 space-y-4">
              <p>To ensure security, please follow these steps to add a new staff member:</p>
              <ol className="list-decimal ml-4 space-y-2">
                  <li>Open an <strong>Incognito / Private Window</strong>.</li>
                  <li>Go to this website and click <strong>Sign Up</strong>.</li>
                  <li>Register the new staff email and password.</li>
                  <li>Close the private window.</li>
                  <li>Refresh this page.</li>
                  <li>Change their role from <strong>User</strong> to <strong>Manager</strong> in the list on the right.</li>
              </ol>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 text-xs text-gray-500 rounded border border-gray-200">
            <strong>Role Guide:</strong>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li><strong>Admin:</strong> Full access to Users, Logs, and Data.</li>
              <li><strong>Manager:</strong> Can Add/Edit Inventory, Sales, Purchasing. No access to Logs/Users.</li>
              <li><strong>User:</strong> Can View data only. Cannot Edit/Delete.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT: USER LIST */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">User Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{profile.email}</div>
                    <div className="text-xs text-gray-400">ID: {profile.id.slice(0,8)}...</div>
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
                      <button className="text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50" title="Save Role">
                        <Save size={16} />
                      </button>
                    </form>
                  </td>

                  {/* DELETE ACTION */}
                  <td className="px-4 py-3 text-center">
                    {profile.id !== user?.id ? (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={profile.id} />
                        <button className="text-gray-300 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50" title="Remove User">
                          <Trash2 size={16} />
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Current User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}