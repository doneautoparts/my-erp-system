'use client'

import { useFormStatus } from 'react-dom'
import { Save, Loader2 } from 'lucide-react'

export default function SaveQtyButton() {
  const { pending } = useFormStatus()

  return (
    <button 
      className="ml-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
      title="Save Quantity"
      disabled={pending}
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Save size={16} />
      )}
    </button>
  )
}