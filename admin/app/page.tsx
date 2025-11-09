import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function Home() {
  const session = await auth()
  
  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect('/login')
  }
  
  // If authenticated, redirect to admin dashboard
  redirect('/admin')
}

