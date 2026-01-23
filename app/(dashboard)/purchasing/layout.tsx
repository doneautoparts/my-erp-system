import Link from 'next/link'

export default function PurchasingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href="/purchasing"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Purchase Orders
          </Link>
          <Link
            href="/purchasing/suppliers"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Suppliers
          </Link>
        </nav>
      </div>
      <main>{children}</main>
    </div>
  )
}