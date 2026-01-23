'use client'

import { Printer } from 'lucide-react'

export default function PrintAction() {
  return (
    <button 
      onClick={() => window.print()}
      className="print:hidden fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-black shadow-lg z-50"
    >
      <Printer size={18} />
      <span>Print / Save as PDF</span>
    </button>
  )
}