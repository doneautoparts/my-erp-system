'use client'

import { useFormStatus } from 'react-dom'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteItemButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="p-2 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      title="Remove Item"
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin text-red-400" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  )
}