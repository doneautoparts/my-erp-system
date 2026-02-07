'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { updateUserRole } from './actions'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  // FIX: Sync local state when Server Data changes
  // This ensures that if the server updates, the dropdown updates too.
  useEffect(() => {
    setRole(initialRole)
  }, [initialRole])

  const handleSave = async () => {
    // 1. Start Loading
    setIsLoading(true)
    setIsSaved(false)
    
    const formData = new FormData()
    formData.append('id', userId)
    formData.append('role', role)

    try {
      // 2. Call Server Action
      await updateUserRole(formData)
      
      // 3. Show Success Green Check
      setIsSaved(true)
      
      // 4. Force a router refresh to be 100% sure data is synced
      router.refresh()
      
      // 5. Reset the green check after 2 seconds
      setTimeout(() => setIsSaved(false), 2000)

    } catch (err) {
      alert("Failed to update role")
      setRole(initialRole) // Revert on error
    } finally {
      setIsLoading(false) // Stop Loading
    }
  }

  // Check if current selection is different from saved DB value
  const hasChanges = role !== initialRole

  return (
    <div className="flex items-center gap-2 justify-center">
      <select 
        value={role}
        onChange={(e) => {
            setRole(e.target.value)
            setIsSaved(false)
        }}
        disabled={isLoading}
        className={`border rounded p-1 text-xs font-bold uppercase cursor-pointer transition-colors ${
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
        // Button enabled if: Loading OR Saved OR Changes exist
        disabled={!hasChanges && !isLoading && !isSaved} 
        className={`p-1.5 rounded transition-all duration-300 ${
            isSaved 
            ? 'bg-green-100 text-green-700 shadow-sm scale-110' 
            : isLoading 
                ? 'bg-gray-100 text-gray-500' 
                : hasChanges
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 hover:scale-105' // Highlight when ready to save
                    : 'text-gray-300' // Ghost when no changes only
        }`}
        title={hasChanges ? "Click to Save" : "No changes"}
      >
        {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
        ) : isSaved ? (
            <Check size={16} strokeWidth={3} />
        ) : (
            <Save size={16} />
        )}
      </button>
    </div>
  )
}