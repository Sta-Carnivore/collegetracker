'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X } from 'lucide-react'

const navItems = [
  { href: '/tracker', label: 'Tracker' },
  { href: '/resume', label: 'Resume' },
  { href: '/ai/recommend', label: 'Recommend' },
  { href: '/ai/strategy', label: 'Strategy' },
  { href: '/bio', label: 'Bio Site' },
  { href: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <nav className="h-14 border-b border-gray-800 bg-gray-950/95 backdrop-blur sticky top-0 z-30 flex items-center px-4 sm:px-6">
        {/* Logo */}
        <Link href="/tracker" className="text-white font-bold text-base mr-6 flex-shrink-0">
          ApplyTracker
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop sign out */}
        <button
          onClick={handleSignOut}
          className="hidden md:block text-gray-400 hover:text-white text-sm transition-colors ml-auto"
        >
          Sign out
        </button>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="md:hidden ml-auto p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 z-40 bg-gray-950 border-b border-gray-800 md:hidden">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); handleSignOut() }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
