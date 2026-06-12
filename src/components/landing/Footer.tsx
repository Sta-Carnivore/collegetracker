import Link from 'next/link'
import { C } from '@/lib/atlas'

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, background: C.bgSoft }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: C.teal }}>
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white"/>
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', color: C.inkMuted, fontSize: 13 }}>ApplyTracker</span>
        </div>
        <p className="text-xs" style={{ color: C.inkFaint }}>Built for students navigating the college application season.</p>
        <div className="flex gap-5 text-xs" style={{ color: C.inkFaint }}>
          <Link href="/login" className="hover:underline">Sign in</Link>
          <a href="#features" className="hover:underline">Features</a>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
