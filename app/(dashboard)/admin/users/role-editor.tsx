'use client'

import { useState } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { updateUserRole } from './actions'

export default function RoleEditor({ 
  userId, 
  initialRole 
}: { 
  userId: string
  initialRole: string 
}) {
  const [role, setRole] = useState(initialRole)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    setIsSaved(false)
    
    const formData = new FormData()
    formData.append('id', userId)
    formData.append('role', role)

    try {
      await updateUserRole(formData)
      // Success visual feedback
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000) // Hide checkmark after 2s
    } catch (err) {
      alert("Failed to update role")
      setRole(initialRole) // Revert on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select 
        value={role}
        onChange={(e) => {
            setRole(e.target.value)
            setIsSaved(false) // Reset saved state if changed
        }}
        className={`border rounded p-1 text-xs font-bold uppercase cursor-pointer ${
          role === 'admin' ? 'text-red-600 border-red-200 bg-red-50' : 
          role === 'manager' ? 'text-blue-600 border-blue-200 bg-blue-50' : 
          'text-gray-600 border-gray-200 bg-gray-50'
        }`}
      >
        <option value="user">User</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>

      <button 
        onClick={handleSave}
        disabled={isLoading || role === initialRole && !isSaved} 
        className={`p-1.5 rounded transition-all ${
            isSaved 
            ? 'bg-green-100 text-green-700' 
            : isLoading 
                ? 'bg-gray-100 text-gray-400' 
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
        }`}
        title="Save Role"
      >
        {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
        ) : isSaved ? (
            <Check size={16} />
        ) : (
            <Save size={16} />
        )}
      </button>
    </div>
  )
}