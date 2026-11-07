import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import EditAvatarModal from '@/components/Profile/Tabs/EditAvatarModal'
import { defaultAvatarImg } from '@/util/constants'
import type { MyInformationTabProps } from '@/types'

const normalizeAvatarSource = (value?: string | null) => {
  if (!value) return defaultAvatarImg

  const trimmed = value.trim()
  if (!trimmed) return defaultAvatarImg
  if (trimmed.startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`
  }

  return trimmed
}

const MyInformationTab = ({ name, email, avatarImgUrl }: MyInformationTabProps) => {
  const { data: session } = useSession()
  const username = session?.user?.name

  // The default avatar is never shown while we don't yet know the user's real one.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    avatarImgUrl?.trim() ? normalizeAvatarSource(avatarImgUrl) : null
  )
  const [userId, setUserId] = useState<string | undefined>()
  const [showEditAvatarModal, setShowEditAvatarModal] = useState(false)
  const hasPromptedForAvatarRef = useRef(false)

  useEffect(() => {
    if (!username) return

    const loadAvatar = async () => {
      let savedAvatarUrl: string | undefined

      try {
        const res = await axios.get(`/api/users?username=${encodeURIComponent(username)}`)
        setUserId(res?.data?._id)
        savedAvatarUrl = res?.data?.avatarImgUrl
      } catch {
        // fall through to the prop / default below
      }

      const resolved = savedAvatarUrl || avatarImgUrl

      // normalizeAvatarSource returns the default only when there's truly no avatar
      setAvatarUrl(normalizeAvatarSource(resolved))

      const needsAvatarPrompt = !resolved || !String(resolved).includes('image/svg+xml')
      if (needsAvatarPrompt && !hasPromptedForAvatarRef.current) {
        hasPromptedForAvatarRef.current = true
        setShowEditAvatarModal(true)
      }
    }

    void loadAvatar()
  }, [avatarImgUrl, username])

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
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${name || 'User'} avatar`}
                width={112}
                height={112}
                className="h-full w-full object-cover"
                unoptimized={avatarUrl.startsWith('blob:') || avatarUrl.startsWith('data:')}
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-[#2d4054]" />
            )}
          </div>

          <button
            type="button"
            disabled={!avatarUrl}
            onClick={() => setShowEditAvatarModal(true)}
            className="mt-4 text-sm font-medium text-[#4ec7b4] transition hover:text-[#7ed7c7] disabled:opacity-50"
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
        currentAvatarUrl={avatarUrl ?? defaultAvatarImg}
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
