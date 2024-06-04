import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn, signOut } from 'next-auth/react'

export function Layout({ children }: { children: ReactNode }) {
  const { data: session } = useSession()

  const lineColor = '#dfdfdf'

  return (
    <div className="flex flex-col h-screen mx-auto bg-[#0A192F]">
      <nav className={`border-b border-[${lineColor}] py-5 relative z-20 bg-background shadow-[0_0_15px_0_rgb(0,0,0,0.1)]`}>
        <div className="flex items-center mx-auto lg:px-6 max-w-7xl px-14">
          <div className="flex flex-row items-center">
            <Link
              className="text-link hover:text-link-light transition-colors no-underline [&_code]:text-link [&_code]:hover:text-link-light [&_code]:transition-colors"
              href="/"
            >
              <span>
                <Image src="/images/logo.webp" alt="" height="40" width="40" />
              </span>
            </Link>
            <ul className="flex items-center content-center">
              <li className="ml-2 text-gray-200">
                <svg
                  viewBox="0 0 24 24"
                  width={32}
                  height={32}
                  stroke={lineColor}
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#2f2f9e"
                  shapeRendering="geometricPrecision"
                >
                  <path d="M16.88 3.549L7.12 20.451" />
                </svg>
              </li>
              <li className="font-medium text-[#449E90]" style={{ letterSpacing: '.01px' }}>
                <a
                  className="text-link hover:text-link-light transition-colors no-underline [&_code]:text-link [&_code]:hover:text-link-light [&_code]:transition-colors text-accents-6 duration-200 hover:text-accents-8 cursor-pointer"
                  target="_blank"
                  rel="noreferrer"
                  href={process.env.NEXTAUTH_URL}
                >
                  Assertiveness-Training
                </a>
              </li>
            </ul>
          </div>
          <div className="justify-end flex-1 hidden md:flex">
            <nav className="inline-flex flex-row items-center">
              <span className="text-[#449E90] flex items-center h-full ml-2 cursor-pointer text-accents-5">
                <a
                  data-variant="ghost"
                  className="relative inline-flex items-center justify-center cursor pointer no-underline px-3.5 rounded-md font-medium outline-0 select-none align-middle whitespace-nowrap transition-colors ease-in duration-200 text-success hover:bg-[rgba(0,68,255,0.06)] h-10 leading-10 text-[18px]"
                  onClick={() => (session ? signOut() : signIn())}
                  rel="noreferrer"
                >
                  {session ? 'Sign Out' : 'Sign In'}
                </a>
              </span>
              {session && (
                <span className="text-[#449E90] flex items-center h-full ml-2 cursor-pointer text-accents-5">
                  <a
                    data-variant="primary"
                    className="relative inline-flex items-center justify-center cursor pointer no-underline px-3.5 rounded-md font-medium outline-0 select-none align-middle whitespace-nowrap transition-colors ease-in duration-200 border-[#dfdfdf] border-solid text-background bg-success border-success-dark hover:bg-success/90 shadow-[0_5px_10px_rgb(0,68,255,0.12)] h-10 leading-10 text-[18px]"
                    rel="noreferrer"
                  >
                    Profile
                  </a>
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
