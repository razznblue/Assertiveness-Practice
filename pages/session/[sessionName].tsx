import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import AudioRecorder from '@/components/AudioRecorder/AudioRecorder'
import Modal from '@/components/Modal'
import axios from 'axios'
import { useEffect, useState, useRef } from 'react'

export default function SessionScreen() {
  const router = useRouter()
  const { data: session } = useSession()

  const sessionName = router.query.sessionName as string
  const topicId = router.query.topicId as string
  const timerFromQuery = Number(router.query.timer ?? '60')
  const timer = Number.isFinite(timerFromQuery) && timerFromQuery > 0 ? timerFromQuery : 60

  const [topic, setTopic] = useState('')
  const [topicImage, setTopicImage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingUploadKey, setPendingUploadKey] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!topicId || hasFetched.current) return
    hasFetched.current = true

    const fetchTopic = async () => {
      try {
        const res = await axios.get(`/api/topics/${topicId}`)
        setTopic(res?.data?.name ?? '')
        setTopicImage(res?.data?.image ?? '')
      } catch (e) {
        console.error('Failed to fetch topic:', e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopic()
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
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `${sessionName}.webm`)
      formData.append('sessionName', sessionName)
      formData.append('topicId', topicId)
      formData.append('topicName', topic)
      formData.append('timer', String(timer))
      formData.append('username', session?.user?.name ?? '')

      const res = await axios.post('/api/sessions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setPendingUploadKey(null)
      setShowSuccessModal(true)
    } catch (e) {
      console.error('Failed to save session:', e)
    }
  }

  const handleRestart = async () => {
    await deletePendingUpload()
    router.push('/session/new')
  }

  const handleHome = async () => {
    await deletePendingUpload()
    router.push('/')
  }

  const handleSuccessClose = async () => {
    setShowSuccessModal(false)
    await deletePendingUpload()
    await router.push('/')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-white">Loading...</div>
  }

  return (
    <>
      <AudioRecorder
        topic={topic}
        topicImage={topicImage}
        sessionName={sessionName}
        onSave={handleSave}
        onRestart={handleRestart}
        onHome={handleHome}
      />

      <Modal
        open={showSuccessModal}
        onClose={handleSuccessClose}
        title="Session Saved"
        description="Your recording was saved successfully and added to your progress history."
        icon={
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#38bda4"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        primaryButtonText="Back to Home"
        onPrimaryClick={handleSuccessClose}
      />
    </>
  )
}
