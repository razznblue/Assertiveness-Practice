import type { PlaceholderTabProps } from '@/types'

const PlaceholderTab = ({ title }: PlaceholderTabProps) => (
  <div className="flex min-h-[400px] items-center justify-center p-10 text-slate-300">
    <div className="rounded-2xl border border-white/10 bg-[#2d4054] px-8 py-6 text-xl">
      {title} is coming soon.
    </div>
  </div>
)

export default PlaceholderTab
