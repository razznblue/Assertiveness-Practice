import { useEffect, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'

import Modal from '@/components/Modal/Modal'
import { syncUserDetails } from '@/hooks/useUserDetails'
import { generateAvatarWithSeed } from '@/util/avatar/avatar'
import { svgToDataUri, dataUriToSvg, normalizeAvatarSource } from '@/util/functions'
import { EditAvatarModalProps } from '@/types'

const isDataUri = (value: string) => value.startsWith('data:image/svg+xml')

const EditAvatarModal = (props: EditAvatarModalProps) => {
  if (!props.open) return null

  return <EditAvatarModalContent key={props.currentAvatarUrl ?? ''} {...props} />
}

const EditAvatarModalContent = ({ open, userId, currentAvatarUrl, onClose, onSaved }: EditAvatarModalProps) => {
  const [topics, setTopics] = useState<string[]>([])
  const [avatarHistory, setAvatarHistory] = useState<Array<{ svg: string; seed: string }>>(() => {
    const normalized = normalizeAvatarSource(currentAvatarUrl)
    return normalized ? [{ svg: normalized, seed: '' }] : []
  })
  const [avatarIndex, setAvatarIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const previewEntry = avatarHistory[avatarIndex] ?? { svg: '', seed: '' }
  const previewSvg = previewEntry.svg

  useEffect(() => {
    let cancelled = false

    const fetchTopics = async () => {
      try {
        const res = await axios.get('/api/topics')
        const topicNames = Array.isArray(res?.data)
          ? res.data
              .map((topic: { name?: string } | null) => topic?.name)
              .filter((name): name is string => Boolean(name && name.trim()))
          : []

        if (!cancelled) setTopics(topicNames)
      } catch (error) {
        console.error('Failed to load topics for avatar generation:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetchTopics()

    return () => {
      cancelled = true
    }
  }, [])

  const generateNewAvatar = () => {
    const nextAvatar = generateAvatarWithSeed(topics)
    // Remember the last five generated avatars in memory
    const nextHistory = [...avatarHistory, nextAvatar].slice(-6)
    setAvatarHistory(nextHistory)
    setAvatarIndex(nextHistory.length - 1)
  }

  const handleGoBack = () => {
    setAvatarIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleGoForward = () => {
    setAvatarIndex((prev) => Math.min(prev + 1, avatarHistory.length - 1))
  }

  const handleSave = async () => {
    if (!userId || !previewSvg) return

    setIsSaving(true)

    try {
      const rawSvg = isDataUri(previewSvg) ? dataUriToSvg(previewSvg) : previewSvg
      const dataUrl = svgToDataUri(rawSvg)
      const res = await axios.patch(`/api/users/${userId}`, { avatarImgUrl: dataUrl })
      const nextUser = res?.data ?? null
      if (nextUser?.username) {
        syncUserDetails(nextUser.username, nextUser)
      }
      onSaved(dataUrl)
      onClose()
    } catch (error) {
      console.error('Failed to save avatar:', error)
      alert('Could not save avatar. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddToLibrary = async () => {
    if (!userId || !previewSvg) return

    try {
      const userRes = await axios.get(`/api/users/${userId}`)
      const existingLibrary = userRes?.data?.userRecord?.library?.userAvatars ?? []
      const cleanSvg = isDataUri(previewSvg) ? dataUriToSvg(previewSvg) : previewSvg

      const nextLibrary = [...existingLibrary, { avatarSvg: cleanSvg, seed: previewEntry.seed ?? '' }]
      const res = await axios.patch(`/api/users/${userId}`, { library: { userAvatars: nextLibrary } })
      const nextUser = res?.data ?? null
      if (nextUser?.username) {
        syncUserDetails(nextUser.username, nextUser)
      }
      alert('Avatar added to your library.')
    } catch (error) {
      console.error('Failed to save avatar to library:', error)
      alert('Could not add avatar to your library. Please try again.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit avatar"
      description="Generate a fresh avatar based on your practice topics, then save it."
      primaryButtonText="Save"
      secondaryButtonText="Cancel"
      onPrimaryClick={handleSave}
      onSecondaryClick={onClose}
      primaryButtonClassName="bg-[#4ec7b4] text-[#0A192F]"
      secondaryButtonClassName="bg-white/10 text-white"
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous avatar"
            onClick={handleGoBack}
            disabled={avatarIndex === 0 || avatarHistory.length <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#243847] text-xl text-white transition hover:bg-[#304d64] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ←
          </button>

          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-[#4ec7b4] bg-[#1f2f3d] shadow-lg shadow-black/20">
            {previewSvg ? (
              isDataUri(previewSvg) ? (
                <Image
                  src={previewSvg}
                  alt="Current avatar preview"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="h-full w-full"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              )
            ) : (
              <span className="text-sm text-slate-300">Loading...</span>
            )}
          </div>

          <button
            type="button"
            aria-label="Next avatar"
            disabled={avatarIndex >= avatarHistory.length - 1}
            onClick={handleGoForward}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#243847] text-xl text-white transition hover:bg-[#304d64] disabled:cursor-not-allowed disabled:opacity-40"
          >
            →
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={generateNewAvatar}
            disabled={isLoading || isSaving}
            className="rounded-xl bg-[#243847] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#304d64] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Generating...' : 'Generate new avatar'}
          </button>

          <button
            type="button"
            onClick={handleAddToLibrary}
            disabled={isSaving || !userId || !previewSvg}
            className="rounded-xl bg-[#4ec7b4] px-4 py-2 text-sm font-semibold text-[#0A192F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add To Library
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default EditAvatarModal
