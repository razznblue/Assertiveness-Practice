import { useEffect, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import EditAvatarModal from '@/components/Profile/Tabs/EditAvatarModal'
import { defaultAvatarImg } from '@/util/constants'
import type { MyInformationTabProps } from '@/types'

const normalizeAvatarSource = (value?: string | null) => {
  if (!value) return defaultAvatarImg
  if (value.trim().startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`
  }
  return value
}

const MyInformationTab = ({ name, email, avatarImgUrl }: MyInformationTabProps) => {
  const { data: session } = useSession()
  const [avatarUrl, setAvatarUrl] = useState(normalizeAvatarSource(avatarImgUrl))
  const [userId, setUserId] = useState<string | undefined>()
  const [showEditAvatarModal, setShowEditAvatarModal] = useState(false)

  useEffect(() => {
    const loadAvatar = async () => {
      if (!session?.user?.name) return

      try {
        const res = await axios.get(`/api/users?username=${encodeURIComponent(session.user.name)}`)
        const nextUserId = res?.data?._id
        const nextAvatarUrl = normalizeAvatarSource(res?.data?.avatarImgUrl || avatarImgUrl || session.user.image || defaultAvatarImg)

        setUserId(nextUserId)
        setAvatarUrl(nextAvatarUrl)
      } catch {
        setAvatarUrl(normalizeAvatarSource(avatarImgUrl || session.user.image || defaultAvatarImg))
      }
    }

    void loadAvatar()
  }, [avatarImgUrl, session?.user?.image, session?.user?.name])

  const details = [
    { label: 'Name', value: name || 'Not provided' },
    { label: 'Email', value: email || 'Not provided' },
    { label: 'Member status', value: 'Active' },
    { label: 'Experience', value: 'Assertiveness practice' },
  ]

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#2d4054] p-6 text-center text-slate-200">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#4ec7b4] bg-[#1f2f3d] shadow-lg shadow-black/20">
            <Image
              src={avatarUrl}
              alt={`${name || 'User'} avatar`}
              width={112}
              height={112}
              className="h-full w-full object-cover"
              unoptimized={avatarUrl.startsWith('blob:') || avatarUrl.startsWith('data:')}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowEditAvatarModal(true)}
            className="mt-4 text-sm font-medium text-[#4ec7b4] transition hover:text-[#7ed7c7]"
          >
            Change avatar
          </button>
        </div>

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
      </div>

      <EditAvatarModal
        open={showEditAvatarModal}
        userId={userId}
        currentAvatarUrl={avatarUrl}
        onClose={() => setShowEditAvatarModal(false)}
        onSaved={(nextAvatarUrl) => {
          setAvatarUrl(nextAvatarUrl)
          setShowEditAvatarModal(false)
        }}
      />
    </>
  )
}

export default MyInformationTab
