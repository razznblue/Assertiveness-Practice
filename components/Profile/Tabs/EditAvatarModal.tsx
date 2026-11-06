import { useEffect, useState } from 'react'
import axios from 'axios'

import Modal from '@/components/Modal/Modal'
import { generateAvatar } from '@/util/avatar/avatar'

interface EditAvatarModalProps {
  open: boolean
  userId?: string
  currentAvatarUrl?: string
  onClose: () => void
  onSaved: (nextAvatarUrl: string) => void
}

const svgToDataUri = (svg: string) => {
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

const EditAvatarModal = ({ open, userId, currentAvatarUrl, onClose, onSaved }: EditAvatarModalProps) => {
  const [topics, setTopics] = useState<string[]>([])
  const [avatarHistory, setAvatarHistory] = useState<string[]>(() => (currentAvatarUrl ? [currentAvatarUrl] : []))
  const [avatarIndex, setAvatarIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const previewSvg = avatarHistory[avatarIndex] ?? ''

  useEffect(() => {
    if (!open) return

    const fetchTopics = async () => {
      setIsLoading(true)
      try {
        const res = await axios.get('/api/topics')
        const topicNames = Array.isArray(res?.data)
          ? res.data
              .map((topic: { name?: string } | null) => topic?.name)
              .filter((name): name is string => Boolean(name && name.trim()))
          : []

        setTopics(topicNames)
        const initialAvatar = generateAvatar(topicNames)
        setAvatarHistory([initialAvatar])
        setAvatarIndex(0)
      } catch (error) {
        console.error('Failed to load topics for avatar generation:', error)
        const fallbackAvatar = generateAvatar()
        setAvatarHistory([fallbackAvatar])
        setAvatarIndex(0)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchTopics()
  }, [open])

  const generateNewAvatar = () => {
    const nextAvatar = generateAvatar(topics)

    const nextHistory = [...avatarHistory, nextAvatar].slice(-5)

    setAvatarHistory(nextHistory)
    setAvatarIndex(nextHistory.length - 1)
  }

  // const generateNewAvatar = () => {
  //   const nextAvatar = generateAvatar(topics)

  //   setAvatarHistory((prev) => {
  //     const nextHistory = [...prev, nextAvatar].slice(-3)
  //     setAvatarIndex(nextHistory.length - 1)
  //     return nextHistory
  //   })
  // }

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
      const dataUrl = svgToDataUri(previewSvg)
      await axios.patch(`/api/users/${userId}`, { avatarImgUrl: dataUrl })
      onSaved(dataUrl)
      onClose()
    } catch (error) {
      console.error('Failed to save avatar:', error)
      alert('Could not save avatar. Please try again.')
    } finally {
      setIsSaving(false)
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
              <div
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            ) : (
              <span className="text-sm text-slate-300">Loading...</span>
            )}
          </div>

          {
            <button
              type="button"
              aria-label="Next avatar"
              onClick={handleGoForward}
              disabled={avatarIndex >= avatarHistory.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#243847] text-xl text-white transition hover:bg-[#304d64] disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>
          }
        </div>

        <button
          type="button"
          onClick={generateNewAvatar}
          disabled={isLoading || isSaving}
          className="rounded-xl bg-[#243847] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#304d64] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Generating...' : 'Generate new avatar'}
        </button>
      </div>
    </Modal>
  )
}

export default EditAvatarModal
