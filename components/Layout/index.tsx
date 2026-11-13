import { ReactNode, useEffect, useRef, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

import { BrandDividerIcon } from '@/components/Icons'
import { useUserDetails } from '@/hooks/useUserDetails'
import Button from '@/components/Button/Button'

const normalizeAvatarSource = (value?: string | null) => {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`
  }

  return trimmed
}

export function Layout({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const { user: userDetails } = useUserDetails(session?.user?.name)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const lineColor = '#dfdfdf'
  const profileImage = normalizeAvatarSource(
    session
      ? userDetails?.avatarImgUrl || session.user.image || null
      : null
  )

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  const navItems = [
    { label: 'My Progress', href: '/profile?tab=My%20Progress' },
    { label: 'My Information', href: '/profile?tab=My%20Information' },
    { label: 'My Library', href: '/profile?tab=My%20Library' },
    { label: 'Feedback', href: '/profile?tab=Feedback' },
    { label: 'Practice Tips', href: '/profile?tab=Practice%20Tips' },
    { label: 'Settings', href: '/profile?tab=Settings' },
  ]

  return (
    <div className="mx-auto flex h-screen flex-col bg-[#0A192F]">
      <nav className="relative z-20 border-b border-[#dfdfdf] bg-background py-5 shadow-[0_0_15px_0_rgb(0,0,0,0.1)]">
        <div className="mx-auto flex max-w-7xl items-center px-14 lg:px-6">
          <div className="flex flex-row items-center">
            <Link
              className="text-link hover:text-link-light transition-colors no-underline [&_code]:text-link [&_code]:hover:text-link-light [&_code]:transition-colors"
              href="/"
            >
              <span>
                <Image loading="eager" src="/images/logo.webp" alt="" height={40} width={40} />
              </span>
            </Link>
            <ul className="flex items-center content-center">
              <li className="ml-2 text-gray-200">
                <BrandDividerIcon size={32} style={{ color: lineColor }} />
              </li>
              <li
                className="text-2xl font-medium text-[#449E90]"
                style={{ letterSpacing: '.01px' }}
              >
                <Link
                  className="text-link hover:text-link-light transition-colors no-underline [&_code]:text-link [&_code]:hover:text-link-light [&_code]:transition-colors text-accents-6 duration-200 hover:text-accents-8 cursor-pointer"
                  rel="noreferrer"
                  href="/"
                >
                  Assertiveness-Training
                </Link>
              </li>
            </ul>
          </div>
          <div className="hidden flex-1 justify-end md:flex">
            <nav className="inline-flex flex-row items-center gap-3">
              {session ? (
                <>
                  <Link
                    href="/session/new"
                    aria-label="New session"
                    title="New session"
                    className="inline-flex items-center gap-2 rounded-full border border-[#4ec7b4] bg-[#4ec7b4]/10 px-3 py-2 text-sm font-semibold text-[#4ec7b4] transition hover:bg-[#4ec7b4]/20"
                  >
                    <span className="text-xl leading-none">+</span>
                    <span>new session</span>
                  </Link>

                  <div ref={menuRef} className="relative">
                    <Button
                      type="button"
                      aria-label="Open profile menu"
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((current) => !current)}
                      className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#1b2e3f] shadow-md shadow-black/20 transition hover:border-[#4ec7b4]"
                    >
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                          unoptimized={profileImage.startsWith('data:') || profileImage.startsWith('blob:')}
                        />
                      ) : (
                        <div className="h-full w-full animate-pulse bg-[#243847]" />
                      )}
                    </Button>

                    {menuOpen && (
                      <div className="absolute right-0 top-full z-30 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#1b2e3f] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                        <div className="mb-2 border-b border-white/10 pb-2">
                          <p className="px-3 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Navigate
                          </p>
                        </div>
                        <div className="space-y-1">
                          {navItems.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className="block rounded-xl px-3 py-2 text-left text-base font-medium text-slate-100 transition hover:bg-white/5"
                            >
                              {item.label}
                            </Link>
                          ))}
                          <Button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false)
                              void signOut({ callbackUrl: '/' })
                            }}
                            className="mt-1 w-full rounded-xl border border-[#4ec7b4]/30 bg-[#4ec7b4]/10 px-3 py-2 text-left text-base font-medium text-[#4ec7b4] transition hover:bg-[#4ec7b4]/20"
                          >
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Button
                  type="button"
                  className="relative inline-flex h-10 cursor-pointer items-center justify-center rounded-md px-3.5 align-middle text-[18px] font-medium text-[#4ec7b4] transition-colors duration-200 hover:bg-[rgba(0,68,255,0.06)]"
                  onClick={() => signIn()}
                >
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
