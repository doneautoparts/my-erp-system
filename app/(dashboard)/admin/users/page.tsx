import { createClient } from '@/utils/supabase/server'
import { Shield, Trash2, UserPlus, Save } from 'lucide-react'
import { createUser, deleteUser, updateUserRole } from './actions'
import { redirect } from 'next/navigation'

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (currentUserProfile?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-red-600">
        <Shield size={48} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>Only Admins can manage users.</p>
      </div>
    )
  }

  // 2. Fetch All Profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: CREATE USER FORM */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={18} /> Create New User
          </h2>
          <form action={createUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Email</label>
              <input name="email" type="email" required className="w-full border rounded p-2 text-sm" placeholder="staff@company.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Password</label>
              <input name="password" type="password" required className="w-full border rounded p-2 text-sm" placeholder="******" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Role</label>
              <select name="role" className="w-full border rounded p-2 text-sm bg-white">
                <option value="user">User (View Only)</option>
                <option value="manager">Manager (Edit Data)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>
            <button className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-500 text-sm font-bold">
              Create User
            </button>
          </form>
          
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
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles?.map((profile) => (
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
                        className={`border rounded p-1 text-xs font-bold uppercase ${
                          profile.role === 'admin' ? 'text-red-600 border-red-200 bg-red-50' : 
                          profile.role === 'manager' ? 'text-blue-600 border-blue-200 bg-blue-50' : 
                          'text-gray-600 border-gray-200 bg-gray-50'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button className="text-gray-400 hover:text-green-600" title="Save Role">
                        <Save size={16} />
                      </button>
                    </form>
                  </td>

                  {/* DELETE ACTION */}
                  <td className="px-4 py-3 text-center">
                    {profile.id !== user?.id ? (
                      <form action={deleteUser} onSubmit={(e) => { if(!confirm('Delete this user?')) e.preventDefault() }}>
                        <input type="hidden" name="id" value={profile.id} />
                        <input type="hidden" name="email" value={profile.email} />
                        <button className="text-gray-300 hover:text-red-600 transition-colors">
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