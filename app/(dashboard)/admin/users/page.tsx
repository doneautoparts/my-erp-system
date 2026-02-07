import { createClient } from '@/utils/supabase/server'
import { Shield, Trash2, UserPlus, Save, AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { deleteUser, toggleApproval, updateUserRole } from './actions'
import RoleEditor from './role-editor'
import { redirect } from 'next/navigation'

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  
  let profiles: any[] = []
  let fetchError = null
  let currentUserRole = 'user'

  // 1. Get Current User (Safe Check)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch Current User's Role (Safe Check)
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    // If no profile found, default to 'user'
    currentUserRole = profile?.role || 'user'
  } catch (err) {
    console.error("Error fetching current user profile", err)
  }

  // 3. Security Block
  if (currentUserRole !== 'admin') {
    return (
      <div className="p-8 text-center text-red-600">
        <Shield size={48} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>Only Admins can manage users.</p>
        <p className="text-xs text-gray-500 mt-2">Current Role: {currentUserRole}</p>
      </div>
    )
  }

  // 4. Fetch All Profiles (Safe Check)
  try {
    const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
    
    if (dbError) throw dbError
    profiles = data || []
  } catch (err: any) {
    fetchError = err.message
    profiles = [] // Ensure it's an array so .map doesn't crash
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
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle size={18} /> {error}
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
        
        {/* LEFT: INSTRUCTION CARD */}
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
                    <div className="text-xs text-gray-400">ID: {profile.id.slice(0,8)}...</div>
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
                  
                  {/* DYNAMIC ROLE EDITOR */}
                  <td className="px-4 py-3">
                    <RoleEditor userId={profile.id} initialRole={profile.role || 'user'} />
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                    {/* Approval Toggle (Only if not self) */}
                    {profile.id !== user.id && (
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

                    {/* Delete (Only if not self) */}
                    {profile.id !== user.id && (
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
    </div>
  )
}