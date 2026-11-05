import type { MyInformationTabProps } from '@/types'

const MyInformationTab = ({ name, email }: MyInformationTabProps) => {
  const details = [
    { label: 'Name', value: name || 'Not provided' },
    { label: 'Email', value: email || 'Not provided' },
    { label: 'Member status', value: 'Active' },
    { label: 'Experience', value: 'Assertiveness practice' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {details.map((detail) => (
        <div
          key={detail.label}
          className="rounded-2xl border border-white/10 bg-[#2d4054] p-5 text-slate-200"
        >
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {detail.label}
          </div>
          <div className="mt-3 text-xl font-medium text-white">{detail.value}</div>
        </div>
      ))}
    </div>
  )
}

export default MyInformationTab
