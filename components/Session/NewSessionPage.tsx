import { useEffect, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { SessionField, SessionInput } from '@/components/Session/SessionField'

const NewSessionPage = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [topic, setTopic] = useState('')
  const [topicId, setTopicId] = useState<string | null>(null)
  const [timer, setTimer] = useState(60)
  const [timerChecked, setTimerChecked] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const generateSessionName = () => {
    const baseTopic = (topic || 'Practice').replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
    const cleanedTopic = baseTopic
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    const adjectives = ['Bold', 'Calm', 'Confident', 'Focused', 'Strong', 'Steady', 'Clear', 'Brave']
    const nounPool = ['Practice', 'Session', 'Focus', 'Reset', 'Response', 'Progress', 'Moment', 'Flow']

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nounPool[Math.floor(Math.random() * nounPool.length)]
    const finalTopic = cleanedTopic || noun

    const displayName = `${adjective} ${finalTopic}`
    setSessionName(displayName)
  }

  const setRandomTopic = async () => {
    const res = await axios.get('/api/topics/random')
    setTopic(res?.data?.topic?.name)
    setTopicId(res?.data?.topic?._id)
  }

  const handleTopicChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTopic(event.target.value)
    setTopicId(null)
  }

  const resolveTopicId = async (): Promise<string | null> => {
    if (!topic || topic === '') return null
    if (topicId) return topicId

    try {
      const res = await axios.post('/api/topics', { name: topic })
      return res?.data?.topic._id ?? null
    } catch (error: any) {
      if (error?.response?.status === 409) {
        return error?.response?.data?.topic?._id ?? null
      }
      console.error('Failed to create/resolve topic:', error)
      return null
    }
  }

  const handleStartClick = async () => {
    if (!sessionName) return
    setIsStarting(true)

    try {
      const resolvedTopicId = await resolveTopicId()
      const params = new URLSearchParams()
      if (resolvedTopicId) params.set('topicId', resolvedTopicId)
      params.set('timer', String(timer))

      await router.push(`/session/${encodeURIComponent(sessionName)}?${params.toString()}`)
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleTimerChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextTimer = Number.isFinite(event.target.valueAsNumber) ? event.target.valueAsNumber : 60
    setTimer(nextTimer)

    if (timerChecked && userId) {
      await axios.patch(`/api/users/${userId}`, { settings: { defaultTimer: nextTimer } })
    }
  }

  const updateTimerPreference = async (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setTimerChecked(checked)
    if (checked && !Number.isNaN(timer) && userId) {
      await axios.patch(`/api/users/${userId}`, { settings: { defaultTimer: timer } })
    }
  }

  useEffect(() => {
    const fetchUserId = async () => {
      if (session?.user?.name) {
        const res = await axios.get(`/api/users?username=${session.user.name}`)
        setUserId(res?.data?._id)
        setTimer(res?.data?.settings?.defaultTimer)
      }
    }

    fetchUserId()
  }, [session])

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <main className="mt-20 flex h-full flex-col items-center justify-start">
          <p className="m-2 p-3 text-center text-4xl text-white">Sign In to start practicing!</p>
          <Image loading="eager" src="/images/logo.webp" alt="App logo" height={500} width={500} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <main className="mt-20 flex h-full flex-col items-center justify-start">
        <div id="top-content" className="flex flex-col items-center justify-start">
          <h1 className="text-3xl font-bold text-primary">New Session</h1>
          <div id="inputs" className="flex min-w-[400px] flex-col items-center justify-center p-3 text-white">
            <SessionField label="Session Name:" helperText="Generate Random →" onHelperClick={generateSessionName}>
              <SessionInput value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
            </SessionField>

            <SessionField label="Topic:" helperText="Generate Random →" onHelperClick={setRandomTopic}>
              <SessionInput value={topic} onChange={handleTopicChange} />
            </SessionField>

            <SessionField label="Timer:">
              <SessionInput
                value={timer}
                type="number"
                max={120}
                onChange={handleTimerChange}
                className="w-1/2 rounded-md bg-gray p-1 px-2 text-black"
              />
            </SessionField>

            <div className="setting flex w-full items-center justify-center pt-1 text-sm">
              <p>Make this my default timer?</p>
              <input
                onChange={updateTimerPreference}
                type="checkbox"
                className="mx-2 rounded-md bg-gray"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 flex w-full items-center justify-between border-t border-gray px-4 py-2">
          <button
            type="button"
            className="rounded-md bg-white px-4 py-2 font-bold text-black"
            onClick={() => router.push('/')}
          >
            ← Back
          </button>
          <button
            type="button"
            className={`rounded-md bg-primary px-4 py-2 font-bold text-black ${isStarting || !sessionName ? 'cursor-not-allowed opacity-50' : ''}`}
            disabled={isStarting || !sessionName}
            onClick={handleStartClick}
          >
            {isStarting ? 'Starting...' : 'Start'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default NewSessionPage
