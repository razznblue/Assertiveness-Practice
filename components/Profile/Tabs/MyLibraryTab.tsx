import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import Modal from '@/components/Modal/Modal'

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
  const [avatars, setAvatars] = useState<UserLibraryAvatar[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | undefined>()
  const [removeTarget, setRemoveTarget] = useState<UserLibraryAvatar | null>(null)

  const librarySections = [{ id: 'avatar-collection', title: 'Avatar Collection' }]

  useEffect(() => {
    if (!session?.user?.name) {
      setLoading(false)
      return
    }

    let isMounted = true

    const loadLibrary = async () => {
      try {
        const res = await axios.get(`/api/users?username=${encodeURIComponent(session.user.name)}`)
        const userRecord = res?.data?.userRecord ?? res?.data ?? {}
        const currentUserId = userRecord?._id
        const savedAvatars = Array.isArray(userRecord?.library?.userAvatars)
          ? userRecord.library.userAvatars
          : Array.isArray(userRecord?.userAvatars)
            ? userRecord.userAvatars
            : []

        if (!isMounted) return

        setUserId(currentUserId)
        setAvatars(savedAvatars)
      } catch (error) {
        console.error('Failed to load avatar library:', error)
        if (isMounted) setAvatars([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadLibrary()

    return () => {
      isMounted = false
    }
  }, [session?.user?.name])

  const equipAvatar = async (avatar: UserLibraryAvatar) => {
    if (!userId || !avatar.avatarSvg) return

    const avatarDataUri = svgToDataUri(avatar.avatarSvg)

    try {
      await axios.patch(`/api/users/${userId}`, { avatarImgUrl: avatarDataUri })
      alert('Avatar equipped successfully.')
    } catch (error) {
      console.error('Failed to equip avatar:', error)
      alert('Could not equip this avatar. Please try again.')
    }
  }

  const removeAvatar = async () => {
    if (!userId || !removeTarget || !removeTarget.avatarSvg) return

    try {
      const remaining = avatars.filter((avatar) => avatar.avatarSvg !== removeTarget.avatarSvg || avatar.seed !== removeTarget.seed)
      await axios.patch(`/api/users/${userId}`, { library: { userAvatars: remaining } })
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

          {loading ? (
            <div className="text-slate-300">Loading avatars...</div>
          ) : avatars.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#1f2f3d] p-5 text-slate-300">
              No avatars saved yet.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {avatars.map((avatar, index) => (
                <div
                  key={`${avatar.seed ?? 'seed'}-${index}`}
                  className="group relative rounded-2xl border border-white/10 bg-[#1f2f3d] p-3 text-center"
                  title={avatar.seed ? `Seed: ${avatar.seed}` : 'No seed available'}
                >
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#4ec7b4] bg-[#0a192f] mx-auto">
                    <div
                      className="h-full w-full"
                      dangerouslySetInnerHTML={{ __html: avatar.avatarSvg ?? '' }}
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => equipAvatar(avatar)}
                      className="flex-1 rounded-xl bg-[#4ec7b4] px-3 py-2 text-sm font-semibold text-[#0A192F] transition hover:brightness-110"
                    >
                      Equip
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
              ))}
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
