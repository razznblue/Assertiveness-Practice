import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import AudioRecorder from '../audio'
import axios from 'axios'
import { useEffect, useState, useRef } from 'react'

export default function SessionScreen() {
  const router = useRouter()
  const { data: session } = useSession()

  const sessionName = router.query.sessionName as string
  const topicId = router.query.topicId as string

  const [topic, setTopic] = useState('')
  const [topicImage, setTopicImage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
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

  const handleSave = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `${sessionName}.webm`)
      formData.append('sessionName', sessionName)
      formData.append('topicId', topicId)
      formData.append('userId', session?.user?.name ?? '')

      await axios.post('/api/sessions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      router.push('/')
    } catch (e) {
      console.error('Failed to save session:', e)
    }
  }

  const handleRestart = () => {
    router.push('/session/new')
  }

  const handleHome = () => {
    router.push('/')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-white">Loading...</div>
  }

  return (
    <AudioRecorder
      topic={topic}
      topicImage={topicImage}
      sessionName={sessionName}
      onSave={handleSave}
      onRestart={handleRestart}
      onHome={handleHome}
    />
  )
}
