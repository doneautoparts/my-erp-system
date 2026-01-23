export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      {/* This layout forces a white background and removes all dashboard menus */}
      {children}
    </div>
  )
}