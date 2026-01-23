import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
        <p className="mt-4 text-lg text-gray-700">Something went wrong during authentication.</p>
        <p className="mt-2 text-sm text-gray-500">
           Possible causes:<br/>
           1. Password is too short (must be 6+ characters)<br/>
           2. Email already registered<br/>
           3. Rate limit exceeded (tried too many times)
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          >
            Go back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}