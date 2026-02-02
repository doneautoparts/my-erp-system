'use client'

import { useFormStatus } from 'react-dom'
import { PackageCheck, Loader2 } from 'lucide-react'

export default function ConfirmGRNButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button 
      disabled={disabled || pending}
      className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-500 mx-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
    >
      {pending ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span>Processing Stock...</span>
        </>
      ) : (
        <>
          <PackageCheck size={20} />
          <span>Confirm & Add to Stock</span>
        </>
      )}
    </button>
  )
}