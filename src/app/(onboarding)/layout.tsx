import { ToastProvider } from '@/components/ui/Toast'

const GRID = 'linear-gradient(rgba(38,63,73,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(38,63,73,0.05) 1px,transparent 1px)'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div
        className="min-h-screen"
        style={{
          backgroundColor: '#EEE7D9',
          backgroundImage: GRID,
          backgroundSize: '28px 28px',
        }}
      >
        <main className="max-w-lg mx-auto px-4 py-12 sm:py-16">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
