'use client'

import { Printer } from 'lucide-react'

export function ReportPrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition-colors"
    >
      <Printer size={16} />
      <span>Print Summary</span>
    </button>
  )
}