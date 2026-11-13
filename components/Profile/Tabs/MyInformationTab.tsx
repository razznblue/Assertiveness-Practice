import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

import EditAvatarModal from '@/components/Profile/Tabs/EditAvatarModal'
import { useUserDetails } from '@/hooks/useUserDetails'
import { defaultAvatarImg } from '@/util/constants'
import type { MyInformationTabProps } from '@/types'
import { normalizeAvatarSource } from '@/util/functions'
import Button from '@/components/Button/Button'

const MyInformationTab = ({ name, email, avatarImgUrl }: MyInformationTabProps) => {
  const { data: session } = useSession()
  const username = session?.user?.name
  const { user } = useUserDetails(username)

  // The default avatar is never shown while we don't yet know the user's real one.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    avatarImgUrl?.trim() ? normalizeAvatarSource(avatarImgUrl) : null
  )
  const [userId, setUserId] = useState<string | undefined>()
  const [showEditAvatarModal, setShowEditAvatarModal] = useState(false)
  const hasPromptedForAvatarRef = useRef(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!username) return

    const resolved = user?.avatarImgUrl || avatarImgUrl
    setUserId(user?._id)
    setAvatarUrl(normalizeAvatarSource(resolved))

    const needsAvatarPrompt = !resolved || !String(resolved).includes('image/svg+xml')
    if (needsAvatarPrompt && !hasPromptedForAvatarRef.current) {
      hasPromptedForAvatarRef.current = true
      setShowEditAvatarModal(true)
    }
  }, [avatarImgUrl, user, username])
  /* eslint-enable react-hooks/set-state-in-effect */

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

          <Button
            type="button"
            disabled={!avatarUrl}
            onClick={() => setShowEditAvatarModal(true)}
            className="mt-4 text-sm font-medium text-[#4ec7b4] transition hover:text-[#7ed7c7] disabled:opacity-50"
          >
            Change avatar
          </Button>
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
