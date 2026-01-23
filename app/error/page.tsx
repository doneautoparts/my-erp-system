import Link from 'next/link'

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  // Wait for the message to arrive
  const { message } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-red-600">Connection Error</h1>
        <div className="mt-6 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-bold text-red-800">System Message:</p>
            <p className="mt-1 text-lg text-red-700 font-mono break-words">
                {message || "No specific error message provided."}
            </p>
        </div>
        <p className="mt-6 text-sm text-gray-500">
           <b>Common Fixes:</b><br/>
           1. Check Vercel Environment Variables (Most likely!)<br/>
           2. Check Supabase Database Password<br/>
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}