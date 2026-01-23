import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to ERP Dashboard</h1>
      <p>Logged in as: {user.email}</p>
    </div>
  )
}