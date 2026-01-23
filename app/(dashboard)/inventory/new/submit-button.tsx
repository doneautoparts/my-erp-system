'use client'

import { useFormStatus } from 'react-dom'
import { Save } from 'lucide-react'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
      }`}
    >
      {pending ? (
        <span>Processing...</span>
      ) : (
        <>
          <Save size={18} />
          <span>Save Item</span>
        </>
      )}
    </button>
  )
}