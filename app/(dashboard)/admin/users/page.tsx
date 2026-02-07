import { createClient } from '@/utils/supabase/server'
import { Shield, Trash2, UserPlus, AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { deleteUser, toggleApproval, updateUserRole } from './actions'
import RoleEditor from './role-editor'
import { redirect } from 'next/navigation'

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // 1. Safe Parameter Reading
  const resolvedParams = await searchParams
  const errorMsg = resolvedParams?.error

  const supabase = await createClient()
  
  let profiles: any[] = []
  let dbError = null
  let currentUserRole = 'user'
  let currentUser = null

  try {
    // 2. Safe Authentication
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      // Don't redirect immediately inside try/catch, just flag it
      throw new Error("Authentication failed")
    }
    currentUser = authData.user

    // 3. Safe Profile Fetch
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .maybeSingle() // Use maybeSingle() to prevent crash if row missing
    
    currentUserRole = profile?.role || 'user'

    // 4. Safe List Fetching
    if (currentUserRole === 'admin') {
        const { data: listData, error: listError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (listError) throw listError
        profiles = listData || []
    }

  } catch (err: any) {
    // Catch ANY crash and save the message to display safely
    dbError = err.message || "Unknown system error"
  }

  // 5. Handle Redirects (Outside try/catch)
  if (!currentUser) {
    redirect('/login')
  }

  // 6. Security View
  if (currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-red-600">
        <Shield size={48} className="mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2">Only Admins can manage users.</p>
        <p className="text-xs text-gray-500 mt-4">Your Role: {currentUserRole}</p>
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

      {/* URL ERROR */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* SYSTEM/DB ERROR (Caught Safely) */}
      {dbError && (
        <div className="p-4 bg-orange-50 text-orange-800 border border-orange-200 rounded-md flex items-center gap-2">
            <AlertTriangle size={20} />
            <div>
                <p className="font-bold">System Warning</p>
                <p className="text-sm">{dbError}</p>
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
              {(profiles || []).map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{profile.email}</div>
                    <div className="text-xs text-gray-400">ID: {String(profile.id).slice(0,8)}...</div>
                  </td>
                  
                  {/* STATUS */}
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
                    <RoleEditor userId={profile.id} initialRole={profile.role || 'user'} />
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                    {profile.id !== currentUser.id && (
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

                    {profile.id !== currentUser.id && (
                      <form action={deleteUser} onSubmit={(e) => { if(!confirm('Delete this user?')) e.preventDefault() }}>
                        <input type="hidden" name="id" value={profile.id} />
                        <button className="text-gray-300 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Delete"><Trash2 size={16} /></button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* EMPTY STATE (Safe) */}
              {profiles.length === 0 && (
                  <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          {dbError ? "System encountered an error loading users." : "No users found."}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}