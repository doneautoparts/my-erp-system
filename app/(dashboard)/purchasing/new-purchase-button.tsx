'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'

export default function NewPurchaseButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    router.push('/purchasing/new')
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <Plus size={16} />
          <span>New Purchase Order</span>
        </>
      )}
    </button>
  )
}