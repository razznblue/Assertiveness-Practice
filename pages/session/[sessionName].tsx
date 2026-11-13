import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import axios from 'axios'

import AudioRecorder from '@/components/AudioRecorder/AudioRecorder'
import Modal from '@/components/Modal'
import Button from '@/components/Button/Button'
import StarRating from '@/components/StarRating/StarRating'
import { CheckIcon } from '@/components/Icons'
import type { TopicImageAttribution } from '@/types'

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function SessionScreen() {
  const router = useRouter()
  const { data: session } = useSession()

  const sessionName = router.query.sessionName as string
  const topicId = router.query.topicId as string
  const timerFromQuery = Number(router.query.timer ?? '60')
  const timer = Number.isFinite(timerFromQuery) && timerFromQuery > 0 ? timerFromQuery : 60
  const shouldReplaceTopicOnTimeout = router.query.replaceTopicOnTimeout === 'true'
  const allowOvertime = router.query.allowOvertime === 'true'

  const [topicDetails, setTopicDetails] = useState<{
    topicId: string
    name: string
    image?: string
    attribution?: TopicImageAttribution
  }>()
  const [loadedTopicId, setLoadedTopicId] = useState<string>()
  const [isUploading, setIsUploading] = useState(false)
  const [pendingUploadKey, setPendingUploadKey] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [sessionRating, setSessionRating] = useState(0)
  const [pendingRecordingId, setPendingRecordingId] = useState<string | null>(null)
  const topic = topicDetails?.topicId === topicId ? topicDetails?.name ?? '' : ''
  const topicImage = topicDetails?.topicId === topicId ? topicDetails?.image : undefined
  const topicImageAttribution = topicDetails?.topicId === topicId ? topicDetails?.attribution : undefined
  const isLoading = !router.isReady || (!!topicId && loadedTopicId !== topicId)
  const backLink = `/session/new?${new URLSearchParams({
    sessionName: sessionName ?? '',
    topic: topic || '',
    topicId: topicId || '',
    timer: String(timer),
    replaceTopicOnTimeout: String(shouldReplaceTopicOnTimeout),
    allowOvertime: String(allowOvertime),
  }).toString()}`

  useEffect(() => {
    if (!topicId) return
    const controller = new AbortController()

    const fetchTopic = async () => {
      try {
        const res = await axios.get(`/api/topics/${topicId}`, { signal: controller.signal })
        const topicData = res?.data
        const unsplashImage = topicData?.unsplashImage
        const hasCompleteUnsplashImage =
          typeof unsplashImage?.photographerName === 'string'
          && unsplashImage.photographerName.trim().length > 0
          && isHttpUrl(unsplashImage?.imageUrl)
          && isHttpUrl(unsplashImage?.photographerUrl)
          && isHttpUrl(unsplashImage?.photoUrl)

        let image: string | undefined
        let attribution: TopicImageAttribution | undefined
        if (hasCompleteUnsplashImage) {
          image = unsplashImage.imageUrl
          attribution = {
            photographerName: unsplashImage.photographerName,
            photographerUrl: unsplashImage.photographerUrl,
            photoUrl: unsplashImage.photoUrl,
          }
        } else {
          image = topicData?.image || undefined
        }
        setTopicDetails({ topicId, name: topicData?.name ?? '', image, attribution })
      } catch (e) {
        if (!axios.isCancel(e)) {
          console.error('Failed to fetch topic:', e)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadedTopicId(topicId)
        }
      }
    }

    fetchTopic()
    return () => controller.abort()
  }, [topicId])

  const deletePendingUpload = async () => {
    if (!pendingUploadKey) return

    try {
      await axios.delete('/api/sessions', {
        params: { key: pendingUploadKey },
      })
    } catch (e) {
      console.error('Failed to delete pending R2 upload:', e)
    } finally {
      setPendingUploadKey(null)
    }
  }

  const handleSave = async (audioBlob: Blob) => {
    const safeSessionName = sessionName?.trim()
    if (!safeSessionName) {
      console.error('Session name is missing before upload.')
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append('audio', audioBlob, `${safeSessionName}.webm`)
      formData.append('sessionName', safeSessionName)
      formData.append('topicId', topicId ?? '')
      formData.append('topicName', topic)
      formData.append('timer', String(timer))
      formData.append('username', session?.user?.name ?? '')

      const response = await axios.post('/api/sessions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setPendingUploadKey(null)
      setPendingRecordingId(response?.data?.recording?._id)
      setSessionRating(0)
      setShowSuccessModal(true)
    } catch (e) {
      console.error('Failed to save session:', e)
    } finally {
      setIsUploading(false)
    }
  }


  const handleRestart = async () => {
    await deletePendingUpload()

    const params = new URLSearchParams({
      sessionName: sessionName ?? '',
      topic: topic || '',
      topicId: topicId ?? '',
      timer: String(timer),
      replaceTopicOnTimeout: String(shouldReplaceTopicOnTimeout),
      allowOvertime: String(allowOvertime),
    })

    await router.push(`/session/${encodeURIComponent(sessionName ?? '')}?${params.toString()}`)
  }

  const handleTimeout = async () => {
    try {
      const res = await axios.get('/api/topics/random')
      const nextTopicId = res?.data?.topic?._id
      const nextTopicName = res?.data?.topic?.name ?? topic

      if (!nextTopicId) return

      const params = new URLSearchParams({
        sessionName: sessionName ?? '',
        topic: nextTopicName,
        topicId: nextTopicId,
        timer: String(timer),
        replaceTopicOnTimeout: String(shouldReplaceTopicOnTimeout),
        allowOvertime: String(allowOvertime),
      })

      await router.push(`/session/${encodeURIComponent(sessionName ?? '')}?${params.toString()}`)
    } catch (error) {
      console.error('Failed to fetch replacement topic:', error)
    }
  }

  const handleHome = async () => {
    await deletePendingUpload()
    router.push('/')
  }

  const handleNewSessionSameTopic = async () => {
    if (sessionRating === 0) {
      return
    }

    try {
      await axios.post(`/api/recordings/${pendingRecordingId}/rate`, {
        rating: sessionRating,
      })
    } catch (error) {
      console.error('Failed to save rating:', error)
    }

    setShowSuccessModal(false)
    await deletePendingUpload()
    await router.push('/session/new')
  }

  const handleGoToProgress = async () => {
    if (sessionRating === 0) {
      return
    }

    try {
      await axios.post(`/api/recordings/${pendingRecordingId}/rate`, {
        rating: sessionRating,
      })
    } catch (error) {
      console.error('Failed to save rating:', error)
    }

    setShowSuccessModal(false)
    await deletePendingUpload()
    await router.push('/profile')
  }

  const handleSuccessClose = async () => {
    if (sessionRating === 0) {
      return
    }

    try {
      await axios.post(`/api/recordings/${pendingRecordingId}/rate`, {
        rating: sessionRating,
      })
    } catch (error) {
      console.error('Failed to save rating:', error)
    }

    setShowSuccessModal(false)
    await deletePendingUpload()
    await router.push('/')
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>
  }

  return (
    <>
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#132737] px-6 py-5 text-center text-white shadow-xl">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#4ec7b4]" />
            <p className="mt-3 text-lg font-semibold">Uploading recording...</p>
            <p className="text-sm text-slate-300">This may take a moment.</p>
          </div>
        </div>
      )}

      <AudioRecorder
        topic={topic}
        topicImage={topicImage}
        topicImageAttribution={topicImageAttribution}
        sessionName={sessionName}
        timerSeconds={timer}
        allowOvertime={allowOvertime}
        replaceTopicOnTimeout={shouldReplaceTopicOnTimeout}
        backLink={backLink}
        onSave={handleSave}
        onRestart={handleRestart}
        onHome={handleHome}
        onTimeout={handleTimeout}
      />

      <Modal
        open={showSuccessModal}
        onClose={handleSuccessClose}
        title="Session Saved"
        description="Your recording was saved successfully and added to your progress history."
        icon={<CheckIcon size={26} style={{ stroke: '#38bda4' }} />}
      >
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-300">Rate your session</p>
            <div className="rounded-xl border border-white/10 bg-[#1f2f3d] p-4">
              <StarRating 
                onRatingChange={setSessionRating}
                currentRating={sessionRating}
                size={36}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              disabled={sessionRating === 0}
              className={`rounded-xl px-4 py-3 font-semibold transition ${
                sessionRating === 0
                  ? 'cursor-not-allowed bg-slate-500 text-slate-300 opacity-50'
                  : 'bg-[#4ec7b4] text-[#0A192F] hover:opacity-90'
              }`}
              onClick={handleSuccessClose}
            >
              Back To Home
            </Button>
            <Button
              type="button"
              disabled={sessionRating === 0}
              className={`rounded-xl border px-4 py-3 font-semibold transition ${
                sessionRating === 0
                  ? 'cursor-not-allowed border-slate-600 bg-slate-900/30 text-slate-400 opacity-50'
                  : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
              }`}
              onClick={handleNewSessionSameTopic}
            >
              Start a New Session
            </Button>
            <Button
              type="button"
              disabled={sessionRating === 0}
              className={`rounded-xl border px-4 py-3 font-semibold transition ${
                sessionRating === 0
                  ? 'cursor-not-allowed border-slate-600 bg-slate-900/30 text-slate-400 opacity-50'
                  : 'border-[#4ec7b4]/60 bg-[#132737] text-[#4ec7b4] hover:bg-[#1f2f3d]'
              }`}
              onClick={handleGoToProgress}
            >
              Go To My Progress
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
