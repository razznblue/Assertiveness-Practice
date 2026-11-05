import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn, signOut } from 'next-auth/react'

import { BrandDividerIcon } from '@/components/Icons'

export function Layout({ children }: { children: ReactNode }) {
  const { data: session } = useSession()

  const lineColor = '#dfdfdf'

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
            <nav className="inline-flex flex-row items-center">
              <span className="text-[#449E90] flex items-center h-full ml-2 cursor-pointer text-accents-5">
                <button
                  type="button"
                  className="relative inline-flex h-10 cursor-pointer items-center justify-center rounded-md px-3.5 align-middle text-[18px] font-medium text-success transition-colors duration-200 hover:bg-[rgba(0,68,255,0.06)]"
                  onClick={() => (session ? signOut() : signIn())}
                >
                  {session ? 'Sign Out' : 'Sign In'}
                </button>
              </span>
              {session && (
                <span className="text-[#449E90] flex items-center h-full ml-2 cursor-pointer text-accents-5">
                  <Link
                    href="/profile"
                    data-variant="primary"
                    className="relative inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-md border border-[#dfdfdf] border-solid bg-success px-3.5 text-[18px] font-medium text-background shadow-[0_5px_10px_rgb(0,68,255,0.12)] transition-colors duration-200 hover:bg-success/90"
                  >
                    Profile
                  </Link>
                </span>
              )}
            </nav>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
