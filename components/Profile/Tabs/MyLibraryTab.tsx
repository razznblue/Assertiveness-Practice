import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import Modal from '@/components/Modal/Modal'
import { useUserDetails } from '@/hooks/useUserDetails'

interface UserLibraryAvatar {
  avatarSvg?: string
  seed?: string
}

const svgToDataUri = (svg: string) => {
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

const MyLibraryTab = () => {
  const { data: session } = useSession()
  const { user, loading: userLoading, refresh } = useUserDetails(session?.user?.name)
  const [avatars, setAvatars] = useState<UserLibraryAvatar[]>([])
  const [userId, setUserId] = useState<string | undefined>()
  const [removeTarget, setRemoveTarget] = useState<UserLibraryAvatar | null>(null)

  const librarySections = [{ id: 'avatar-collection', title: 'Avatar Collection' }]

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) {
      setAvatars([])
      setUserId(undefined)
      return
    }

    const savedAvatars = Array.isArray(user.library?.userAvatars)
      ? user.library.userAvatars
      : Array.isArray((user as Record<string, unknown>).userAvatars)
        ? ((user as Record<string, unknown>).userAvatars as UserLibraryAvatar[])
        : []

    setUserId(user._id)
    setAvatars(savedAvatars)
  }, [user])
  /* eslint-enable react-hooks/set-state-in-effect */

  const equipAvatar = async (avatar: UserLibraryAvatar) => {
    if (!userId || !avatar.avatarSvg) return

    const avatarDataUri = svgToDataUri(avatar.avatarSvg)

    try {
      await axios.patch(`/api/users/${userId}`, { avatarImgUrl: avatarDataUri })
      await refresh(true)
    } catch (error) {
      console.error('Failed to equip avatar:', error)
    }
  }

  const removeAvatar = async () => {
    if (!userId || !removeTarget || !removeTarget.avatarSvg) return

    try {
      const remaining = avatars.filter((avatar) => avatar.avatarSvg !== removeTarget.avatarSvg || avatar.seed !== removeTarget.seed)
      await axios.patch(`/api/users/${userId}`, { library: { userAvatars: remaining } })
      await refresh(true)
      setAvatars(remaining)
      setRemoveTarget(null)
    } catch (error) {
      console.error('Failed to remove avatar from library:', error)
      alert('Could not remove this avatar. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {librarySections.map((section) => (
        <div key={section.id} className="rounded-2xl border border-white/10 bg-[#2d4054] p-5 text-slate-200">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Library
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-[#4ec7b4]">{section.title}</h2>
            </div>
          </div>

          {userLoading ? (
            <div className="text-slate-300">Loading avatars...</div>
          ) : avatars.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#1f2f3d] p-5 text-slate-300">
              No avatars saved yet.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {avatars.map((avatar, index) => {
                const avatarDataUri = avatar.avatarSvg ? svgToDataUri(avatar.avatarSvg) : null
                const isActive = Boolean(user?.avatarImgUrl && avatarDataUri && user.avatarImgUrl === avatarDataUri)

                return (
                  <div
                    key={`${avatar.seed ?? 'seed'}-${index}`}
                    className={`group relative rounded-2xl border p-3 text-center transition ${
                      isActive
                        ? 'border-[#4ec7b4] bg-[#1f2f3d] shadow-[0_0_0_2px_rgba(78,199,180,0.25)]'
                        : 'border-white/10 bg-[#1f2f3d]'
                    }`}
                    title={avatar.seed ? `Seed: ${avatar.seed}` : 'No seed available'}
                  >
                    {isActive && (
                      <span className="absolute right-3 top-3 rounded-full border border-[#4ec7b4] bg-[#4ec7b4]/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#4ec7b4]">
                        Active
                      </span>
                    )}

                    <div className="mx-auto mt-2 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#4ec7b4] bg-[#0a192f]">
                      <div
                        className="h-full w-full"
                        dangerouslySetInnerHTML={{ __html: avatar.avatarSvg ?? '' }}
                      />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => equipAvatar(avatar)}
                        disabled={isActive}
                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          isActive
                            ? 'cursor-default bg-[#4ec7b4]/10 text-[#9ae7db] opacity-90'
                            : 'bg-[#4ec7b4] text-[#0A192F] hover:brightness-110'
                        }`}
                      >
                        {isActive ? 'Active' : 'Equip'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRemoveTarget(avatar)}
                        className="rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove avatar"
        description="Are you sure you want to remove this avatar from your library?"
        primaryButtonText="Remove"
        secondaryButtonText="Cancel"
        onPrimaryClick={removeAvatar}
        onSecondaryClick={() => setRemoveTarget(null)}
        primaryButtonClassName="bg-red-500 text-white"
        secondaryButtonClassName="bg-white/10 text-white"
      />
    </div>
  )
}

export default MyLibraryTab
