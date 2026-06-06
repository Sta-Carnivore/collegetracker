import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import { ToastProvider } from '@/components/ui/Toast'

const GRID = 'linear-gradient(rgba(38,63,73,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(38,63,73,0.05) 1px,transparent 1px)'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (profile?.onboarding_completed !== true) redirect('/onboarding')

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#EEE7D9' }}>
        <Sidebar />

        <div
          className="flex-1 min-w-0 overflow-y-auto"
          style={{
            backgroundColor: '#EEE7D9',
            backgroundImage: GRID,
            backgroundSize: '28px 28px',
          }}
        >
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-24 md:pb-10">
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </ToastProvider>
  )
}
